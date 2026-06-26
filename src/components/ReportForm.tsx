import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Mic, MicOff, AlertCircle, RefreshCw, CheckCircle, ThumbsUp } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, setDoc, getDoc, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import { CivicCategory, IssueLocation } from '../types';

interface ReportFormProps {
  onSuccess: (issueId: string) => void;
  onNavigateToIssue: (id: string) => void;
}

export default function ReportForm({ onSuccess, onNavigateToIssue }: ReportFormProps) {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Location States
  const [location, setLocation] = useState<IssueLocation | null>(null);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // AI Classification States
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [confirmedCategory, setConfirmedCategory] = useState<CivicCategory>('other');
  const [confirmedSeverity, setConfirmedSeverity] = useState<number>(3);
  const [confirmedDept, setConfirmedDept] = useState<string>('');
  const [confirmedTitle, setConfirmedTitle] = useState<string>('');

  // Duplicate Check States
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<any | null>(null);

  // Overall Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Automatically start fetching location on mount
  useEffect(() => {
    captureGPS();
    
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Indian English/Hindi friendly translation bias

      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setDescription((prev) => (prev ? prev + ' ' + text : text));
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Web Speech triggers
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice-to-text is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Browser Geolocation capture with OSM Reverse Geocoder
  const captureGPS = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setCapturingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Free OSM Nominatim reverse lookup
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            
            // Extract a clean ward/suburb name for hyperlocal segmentation
            const addrDetails = data.address || {};
            const ward = addrDetails.suburb || addrDetails.neighbourhood || addrDetails.residential || addrDetails.city_district || "Central Ward";

            setLocation({ lat, lng, address });
            // Save ward to AI results or confirmed state later
          } else {
            setLocation({ lat, lng, address: `Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}` });
          }
        } catch (err) {
          setLocation({ lat, lng, address: `Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}` });
        } finally {
          setCapturingLocation(false);
        }
      },
      (err) => {
        setLocationError(`GPS Capture Error: ${err.message}. Enabling central default coordinates.`);
        // Fallback Bengaluru Coordinates
        setLocation({ lat: 12.9716, lng: 77.5946, address: "Koramangala 4th Block, Bengaluru, Karnataka, 560034" });
        setCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Image handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress and resize image before upload/analysis
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setImage(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 1. Call Gemini Vision Classify API on the server
  const triggerAIClassification = async () => {
    if (!image) return;
    setLoadingAI(true);
    setError(null);
    setAiResult(null);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image, userText: description }),
      });

      if (!response.ok) {
        throw new Error('AI classification request failed');
      }

      const result = await response.json();
      setAiResult(result);
      
      // Seed validation inputs
      setConfirmedCategory(result.category || 'other');
      setConfirmedSeverity(result.severity || 3);
      setConfirmedDept(result.department || 'General Administration');
      setConfirmedTitle(result.title || 'Civic Issue');

      // 2. Perform duplicate check using Firestore and Gemini Deduplication
      await checkForDuplicates(result.category || 'other');
    } catch (err: any) {
      setError(`Gemini classification failed: ${err.message}. You can still enter details manually.`);
      setAiResult({
        category: 'other',
        severity: 3,
        title: 'Reported Issue',
        department: 'Public Works Department',
        confidence: 0.5,
        reasoning: 'Fallback due to service timeout'
      });
      setConfirmedCategory('other');
      setConfirmedSeverity(3);
      setConfirmedDept('Public Works Department');
      setConfirmedTitle('Civic Issue');
    } finally {
      setLoadingAI(false);
    }
  };

  // 2. Local Firestore Duplicate Check + Gemini API Deduplication
  const checkForDuplicates = async (category: string) => {
    if (!location) return;
    setCheckingDuplicates(true);

    try {
      // Query recent open issues of the same category
      const q = query(
        collection(db, 'issues'),
        where('category', '==', category),
        where('status', '!=', 'resolved')
      );

      const snapshot = await getDocs(q);
      const candidates: any[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.location) {
          // Simple rough distance check: within ~0.002 lat/lng degrees (approx 200m)
          const latDiff = Math.abs(data.location.lat - location.lat);
          const lngDiff = Math.abs(data.location.lng - location.lng);
          
          if (latDiff < 0.002 && lngDiff < 0.002) {
            candidates.push({
              id: docSnap.id,
              title: data.title,
              description: data.description,
              location: data.location,
              createdAt: data.createdAt,
            });
          }
        }
      });

      if (candidates.length === 0) {
        setDuplicateAlert(null);
        return;
      }

      // Call server duplicate AI check with surrounding candidates
      const response = await fetch('/api/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          lat: location.lat,
          lng: location.lng,
          description,
          existingReports: candidates,
        }),
      });

      if (response.ok) {
        const dupResult = await response.json();
        if (dupResult.isDuplicate && dupResult.duplicateOf) {
          const matchedDoc = candidates.find((c) => c.id === dupResult.duplicateOf);
          setDuplicateAlert({
            issueId: dupResult.duplicateOf,
            title: matchedDoc?.title || "Matching Issue",
            reasoning: dupResult.reasoning,
            confidence: dupResult.confidence,
          });
        } else {
          setDuplicateAlert(null);
        }
      }
    } catch (err) {
      console.error('Duplicate checking failed:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Direct quick action: Upvote/Verify existing original report instead of submitting duplicate
  const handleVerifyOriginal = async (originalId: string) => {
    if (!auth.currentUser) {
      alert("Please login first to verify this issue");
      return;
    }
    setSubmitting(true);

    try {
      const issueRef = doc(db, 'issues', originalId);
      const userUid = auth.currentUser.uid;

      // Quick fix: updateDoc using arrayUnion
      const { arrayUnion } = await import('firebase/firestore');
      await updateDoc(issueRef, {
        verifiedBy: arrayUnion(userUid),
        verificationCount: increment(1),
        updatedAt: new Date().toISOString(),
      });

      // Award 10 XP to current user for verifying
      const userRef = doc(db, 'users', userUid);
      await updateDoc(userRef, {
        xp: increment(10),
        verificationsCount: increment(1),
      });

      alert("XP Awarded! You successfully verified the original report instead of generating a duplicate.");
      onNavigateToIssue(originalId);
    } catch (err: any) {
      console.error(err);
      alert("Verification failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Create real ticket and commit to Firestore
  const handleFinalSubmit = async () => {
    if (!image || !location) return;
    setSubmitting(true);
    setError(null);

    try {
      const userUid = auth.currentUser?.uid || 'anonymous';
      const userEmail = auth.currentUser?.email || 'anonymous@civicpulse.org';
      const userDisplayName = auth.currentUser?.displayName || 'Citizen Hero';

      const createdAtStr = new Date().toISOString();
      
      // Calculate SLA Deadline: (e.g. 24h per severity level, lower severity = more time, critical = 4 hours)
      // Severity 5 = 4 hours, 4 = 12 hours, 3 = 24 hours, 2 = 48 hours, 1 = 72 hours
      const slaHours = [72, 48, 24, 12, 4][confirmedSeverity - 1] || 24;
      const slaDeadlineDate = new Date();
      slaDeadlineDate.setHours(slaDeadlineDate.getHours() + slaHours);

      // Extract raw ward name from Nominatim address
      let extractedWard = 'Central Ward';
      const addressParts = location.address.split(',');
      if (addressParts.length > 2) {
        extractedWard = addressParts[1].trim(); // Rough proxy suburb/ward
      }

      const issuePayload: any = {
        title: confirmedTitle || `Civic issue in ${extractedWard}`,
        description: description || `Reported ${confirmedCategory} issue.`,
        category: confirmedCategory,
        severity: confirmedSeverity,
        status: 'reported',
        imageUrl: image, // Store the base64 URL directly in Firestore (clean, responsive, 100% robust)
        location: {
          lat: location.lat,
          lng: location.lng,
          address: location.address,
        },
        ward: extractedWard,
        reportedBy: userUid,
        verifiedBy: [],
        verificationCount: 0,
        department: confirmedDept,
        aiClassification: aiResult || {},
        isDuplicate: duplicateAlert ? true : false,
        duplicateOf: duplicateAlert ? duplicateAlert.issueId : null,
        createdAt: createdAtStr,
        updatedAt: createdAtStr,
        resolvedAt: null,
        slaDeadline: slaDeadlineDate.toISOString(),
      };

      // Create issue in Firestore
      const issuesCollection = collection(db, 'issues');
      const docRef = await addDoc(issuesCollection, issuePayload);

      // Award Gamification: +50 XP to reporter, increment report statistics
      if (auth.currentUser) {
        const userRef = doc(db, 'users', userUid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const currentBadges = userSnap.data().badges || [];
          const updatedBadges = [...currentBadges];

          if (!updatedBadges.includes('First Responder')) {
            updatedBadges.push('First Responder');
          }

          await updateDoc(userRef, {
            xp: increment(50),
            reportsCount: increment(1),
            badges: updatedBadges,
          });
        } else {
          // Initialize user profile if missing
          await setDoc(userRef, {
            uid: userUid,
            displayName: userDisplayName,
            email: userEmail,
            xp: 50,
            badges: ['First Responder'],
            reportsCount: 1,
            verificationsCount: 0,
            resolvedCount: 0,
            ward: extractedWard,
            joinedAt: createdAtStr,
          });
        }
      }

      onSuccess(docRef.id);
    } catch (err: any) {
      setError(`Submission failed: ${err.message}`);
      handleFirestoreError(err, OperationType.WRITE, 'issues');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* 1. Camera / File Upload Drag-and-Drop */}
      <div>
        <label className="block text-sm font-bold text-slate-800 mb-2">
          1. Capture or Select Image of the Issue <span className="text-red-500">*</span>
        </label>
        
        {image ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group bg-slate-50">
            <img src={image} alt="Civic issue" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setAiResult(null);
                setDuplicateAlert(null);
              }}
              className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-950 text-white rounded-lg p-2 text-xs font-semibold backdrop-blur-sm transition cursor-pointer"
            >
              Change Photo
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/20 transition cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Camera className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm">Take Photo or Browse</p>
            <p className="text-xs text-slate-400">Supports drag-and-drop or device camera capture</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* 2. Geolocation Capture Indicator */}
      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex gap-2.5 items-start">
          <MapPin className={`w-5 h-5 flex-shrink-0 mt-0.5 ${location ? 'text-emerald-500' : 'text-slate-400'}`} />
          <div className="space-y-0.5">
            <h5 className="text-xs font-bold text-slate-800">Hyperlocal Geolocation Tracking</h5>
            {capturingLocation ? (
              <p className="text-[11px] text-slate-500 animate-pulse">Detecting GPS coordinates...</p>
            ) : location ? (
              <p className="text-[11px] text-slate-600 font-mono leading-normal truncate max-w-sm" title={location.address}>
                {location.address}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">GPS location is required before submitting.</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={captureGPS}
          disabled={capturingLocation}
          className="p-1.5 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition disabled:opacity-50 cursor-pointer"
          title="Recapture Location"
        >
          <RefreshCw className={`w-4 h-4 ${capturingLocation ? 'animate-spin text-blue-500' : ''}`} />
        </button>
      </div>

      {/* 3. Voice and Text Description Area */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-bold text-slate-800">
            2. Describe the Issue (Optional)
          </label>
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border shadow-sm transition ${
              isListening
                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isListening ? 'Stop' : 'Voice Input'}
          </button>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter details like severity depth, obstruction hazard, landmark clues..."
          rows={3}
          className="w-full rounded-xl border border-slate-250 p-3 text-sm focus:border-blue-500 focus:outline-none transition leading-relaxed"
        />
      </div>

      {/* 4. Trigger AI Classification Button */}
      {image && !aiResult && (
        <button
          type="button"
          onClick={triggerAIClassification}
          disabled={loadingAI || !location}
          className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 rounded-xl font-bold text-sm shadow flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
        >
          {loadingAI ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
          {loadingAI ? 'AI Classifying Issue...' : 'Run Gemini AI Diagnostics'}
        </button>
      )}

      {/* 5. AI Diagnostics Result & Triage Confirmation */}
      {aiResult && (
        <div className="p-4 rounded-xl border border-indigo-150 bg-indigo-50/30 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">
                AI Diagnostics Complete
              </span>
              <h4 className="font-extrabold text-slate-900 text-sm">Triage Recommendations</h4>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-700">
                Confidence: {Math.round(aiResult.confidence * 100)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 italic leading-relaxed">
            "<strong>AI Reasoning:</strong> {aiResult.reasoning}"
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Title</label>
              <input
                type="text"
                value={confirmedTitle}
                onChange={(e) => setConfirmedTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Agency</label>
              <input
                type="text"
                value={confirmedDept}
                onChange={(e) => setConfirmedDept(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Verify Category</label>
              <select
                value={confirmedCategory}
                onChange={(e) => setConfirmedCategory(e.target.value as CivicCategory)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
              >
                <option value="pothole">Pothole</option>
                <option value="streetlight">Broken Streetlight</option>
                <option value="water_leak">Water Leak</option>
                <option value="waste">Waste Management</option>
                <option value="road_damage">Road Damage</option>
                <option value="other">Other Civic Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Verify Severity (1-5)</label>
              <select
                value={confirmedSeverity}
                onChange={(e) => setConfirmedSeverity(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
              >
                <option value={1}>1 - Low Priority</option>
                <option value={2}>2 - Minor</option>
                <option value={3}>3 - High</option>
                <option value={4}>4 - Severe</option>
                <option value={5}>5 - Emergency</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 6. Duplicate Verification Notice */}
      {duplicateAlert && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-3">
          <div className="flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Duplicate Report Detected</h5>
              <p className="text-xs text-slate-700 leading-normal">
                An active issue matching this description exists 200m near you: 
                <strong className="text-slate-900 block mt-1">"{duplicateAlert.title}"</strong>
              </p>
              <p className="text-[11px] text-slate-600 italic">
                AI Match Reasoning: "{duplicateAlert.reasoning}"
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-1.5">
            <button
              type="button"
              onClick={() => handleVerifyOriginal(duplicateAlert.issueId)}
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Upvote Original (+10 XP)
            </button>
            <button
              type="button"
              onClick={() => setDuplicateAlert(null)}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg cursor-pointer transition"
            >
              Submit Separate
            </button>
          </div>
        </div>
      )}

      {/* Final Action Submission Bar */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-150 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {location && image && aiResult && !duplicateAlert && (
        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-blue-100 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
        >
          {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4.5 h-4.5" />}
          {submitting ? 'Creating Secure Ticket...' : 'File Secure Report (+50 XP)'}
        </button>
      )}

    </div>
  );
}
