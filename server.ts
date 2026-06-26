import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize the GoogleGenAI client (modern @google/genai SDK)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Ensure the API key exists
const checkApiKey = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
};

// Helper to call Gemini with a retry wrapper for transient errors like 503
async function callGeminiWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = (error.message || '').toLowerCase() + ' ' + JSON.stringify(error).toLowerCase();
    const isTransient = error.status === 503 || 
                        error.status === 429 ||
                        errorStr.includes('503') || 
                        errorStr.includes('429') ||
                        errorStr.includes('unavailable') || 
                        errorStr.includes('high demand') ||
                        errorStr.includes('limit');
    
    if (retries > 0 && isTransient) {
      console.warn(`Gemini API transient issue detected. Retrying in ${delay}ms... (${retries} retries left). Error: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callGeminiWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// Fallback Generators for robust offline/high-demand handling
function getClassificationFallback(userText: string = ''): any {
  const text = userText.toLowerCase();
  let category = 'other';
  let title = 'Reported Civic Issue';
  let department = 'Municipal Corporation';
  let severity = 3;
  let reasoning = 'Fallback classification based on description match due to AI demand.';

  if (text.includes('pothole') || text.includes('road') || text.includes('crater') || text.includes('street damage') || text.includes('tar') || text.includes('pavement')) {
    category = 'pothole';
    title = 'Road Pothole Damage';
    department = 'Public Works Department';
    severity = 3;
  } else if (text.includes('light') || text.includes('dark') || text.includes('lamp') || text.includes('electricity') || text.includes('streetlight') || text.includes('bulb')) {
    category = 'streetlight';
    title = 'Streetlight Malfunction';
    department = 'Electricity Board';
    severity = 2;
  } else if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('drain') || text.includes('sewage') || text.includes('flood') || text.includes('overflow')) {
    category = 'water_leak';
    title = 'Water Pipeline / Drainage Leak';
    department = 'Water Board';
    severity = 4;
  } else if (text.includes('waste') || text.includes('garbage') || text.includes('trash') || text.includes('rubbish') || text.includes('dump') || text.includes('litter') || text.includes('bin')) {
    category = 'waste';
    title = 'Waste & Garbage Accumulation';
    department = 'Municipal Corporation';
    severity = 2;
  } else if (text.includes('damage') || text.includes('broken') || text.includes('sidewalk') || text.includes('path') || text.includes('bridge') || text.includes('divider')) {
    category = 'road_damage';
    title = 'Infrastructure Damage';
    department = 'Public Works Department';
    severity = 3;
  }

  return {
    category,
    severity,
    title,
    department,
    confidence: 0.7,
    reasoning: reasoning + ` Categorized based on descriptive keyword context.`
  };
}

function getDuplicateFallback(): any {
  return {
    isDuplicate: false,
    duplicateOf: null,
    confidence: 0.5,
    reasoning: 'Assumed unique: Skipped deduplication analysis due to temporary high AI demand.'
  };
}

function getPredictionFallback(wardName: string = 'Central Ward'): any[] {
  return [
    {
      category: 'Road Network',
      riskLevel: 'high',
      predictedLocation: `${wardName} Primary Transit Corridors`,
      reasoning: 'Heavier traffic volumes and upcoming seasonal monsoon precipitation pose a high pothole risk.',
      recommendedAction: 'Execute preventive asphalt sealing and resurfacing on priority routes.'
    },
    {
      category: 'Water Infrastructure',
      riskLevel: 'medium',
      predictedLocation: `${wardName} Low-Lying Zones`,
      reasoning: 'Aging distribution lines and minor water logging patterns suggest possible water line fractures.',
      recommendedAction: 'Proactively monitor pressure sensors and execute valve diagnostic checks.'
    },
    {
      category: 'Waste Management',
      riskLevel: 'low',
      predictedLocation: `${wardName} Commercial Hubs`,
      reasoning: 'Heightened weekend retail footfall points to potential trash bin overflows.',
      recommendedAction: 'Deploy additional bin capacities and align extra collection runs.'
    }
  ];
}

// 1. API Route: Classify civic issue from base64 image + description
app.post('/api/classify', async (req, res) => {
  const { imageBase64, userText } = req.body;
  try {
    checkApiKey();

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Extract mime type and base64 string
    const match = imageBase64.match(/^data:([^;]+);base64,(.*)$/);
    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;

    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const promptText = `
You are an AI assistant for a civic issue reporting platform in India.
Analyze this image and the user's description, then return ONLY valid JSON:
{
  "category": "pothole" or "streetlight" or "water_leak" or "waste" or "road_damage" or "other",
  "severity": integer 1-5 (1=minor, 5=critical/emergency),
  "title": "concise 6-word issue title",
  "department": "which govt department should handle this (e.g. Public Works Department, Municipal Corporation, Water Board, Electricity Board)",
  "confidence": float 0-1,
  "reasoning": "one sentence explaining classification"
}
User description: ${userText || "No user description provided."}
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [imagePart, promptText],
        config: {
          responseMimeType: 'application/json',
        },
      })
    );

    const outputText = response.text;
    if (!outputText) {
      throw new Error('No classification output returned from Gemini');
    }

    const classifiedResult = JSON.parse(outputText.trim());
    return res.json(classifiedResult);
  } catch (error: any) {
    console.error('Error in /api/classify, using fallback:', error);
    const fallback = getClassificationFallback(userText);
    return res.json(fallback);
  }
});

// 2. API Route: Check if reported issue is a duplicate
app.post('/api/duplicate', async (req, res) => {
  const { category, lat, lng, description, existingReports } = req.body;
  try {
    checkApiKey();

    const promptText = `
You are checking for duplicate civic issue reports.
New report:
- Category: ${category}
- Location: Lat: ${lat}, Lng: ${lng}
- Description: ${description || "None"}

Existing open reports in a 200m radius:
${JSON.stringify(existingReports || [])}

Compare the categories, geographic proximity, and descriptive content.
Return ONLY valid JSON:
{
  "isDuplicate": boolean,
  "duplicateOf": "string (the matching issue id) or null if not a duplicate",
  "confidence": float 0-1,
  "reasoning": "one sentence explaining the deduplication judgment"
}
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );

    const outputText = response.text;
    if (!outputText) {
      throw new Error('No deduplication output returned from Gemini');
    }

    const duplicateResult = JSON.parse(outputText.trim());
    return res.json(duplicateResult);
  } catch (error: any) {
    console.error('Error in /api/duplicate, using fallback:', error);
    const fallback = getDuplicateFallback();
    return res.json(fallback);
  }
});

// 3. API Route: Predictive analysis of infrastructure hotspots per ward
app.post('/api/predict', async (req, res) => {
  const { wardName, aggregatedStats } = req.body;
  try {
    checkApiKey();

    const promptText = `
You are a civic infrastructure analyst. Based on historical issue data for ward: "${wardName}":
${JSON.stringify(aggregatedStats || {})}

Identify infrastructure risk zones and predict likely upcoming issues.
Return ONLY a valid JSON array of predictions. Each prediction item must be strictly formatted as:
{
  "category": "infrastructure category of risk (e.g. Streetlighting, Water Infrastructure, Road Network, Waste Management)",
  "riskLevel": "low" or "medium" or "high" or "critical",
  "predictedLocation": "area name or specific sector descriptor",
  "reasoning": "data-backed one-sentence analysis detailing why this risk exists",
  "recommendedAction": "specific preventive action government department should take"
}

Provide 2 to 3 high-quality predictions.
`;

    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );

    const outputText = response.text;
    if (!outputText) {
      throw new Error('No prediction output returned from Gemini');
    }

    const predictionArray = JSON.parse(outputText.trim());
    return res.json(predictionArray);
  } catch (error: any) {
    console.error('Error in /api/predict, using fallback:', error);
    const fallback = getPredictionFallback(wardName);
    return res.json(fallback);
  }
});

// 4. Vite Dev Server Middleware or Production Static Servings
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
