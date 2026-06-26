import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Issue, CivicCategory, IssueStatus } from '../types';
import IssueCard from '../components/IssueCard';
import MapView from '../components/MapView';
import { Grid, Map, Search, SlidersHorizontal, AlertCircle, X } from 'lucide-react';

interface FeedViewProps {
  onNavigateToIssue: (id: string) => void;
}

export default function FeedView({ onNavigateToIssue }: FeedViewProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CivicCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const issuesRef = collection(db, 'issues');
    const q = query(issuesRef, orderBy('createdAt', 'desc'));

    // Real-time listener for absolute live synchronization
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedIssues: Issue[] = [];
        snapshot.forEach((doc) => {
          loadedIssues.push({
            id: doc.id,
            ...(doc.data() as Omit<Issue, 'id'>),
          });
        });
        setIssues(loadedIssues);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'issues');
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtering Logic
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.ward.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, description, ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition leading-normal"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-sm transition cursor-pointer ${
              showFilters || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Interactive Map View"
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Drawer Filter Options */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category Filter</label>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'pothole', 'streetlight', 'water_leak', 'waste', 'road_damage', 'other'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'all' ? 'All categories' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ticketing Status</label>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'reported', 'verified', 'assigned', 'in_progress', 'resolved'] as const).map((stat) => (
                <button
                  key={stat}
                  onClick={() => setSelectedStatus(stat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer border ${
                    selectedStatus === stat
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {stat === 'all' ? 'All statuses' : stat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Data Display */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Retrieving real-time reports stream...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center bg-white border border-slate-150 p-12 rounded-xl">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">No reports match your filters</h3>
          <p className="text-xs text-slate-500">Try loosening your category chips or clearing your search queries.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onClick={onNavigateToIssue}
            />
          ))}
        </div>
      ) : (
        <div className="h-[550px] relative animate-fadeIn shadow-inner">
          <MapView
            issues={filteredIssues}
            onClickIssue={onNavigateToIssue}
          />
        </div>
      )}

    </div>
  );
}
