import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { Issue, Comment, IssueStatus } from '../types';
import StatusTimeline from '../components/StatusTimeline';
import SeverityBadge from '../components/SeverityBadge';
import { ThumbsUp, Calendar, MapPin, Sparkles, Clock, Share2, MessageSquare, ArrowLeft, Send } from 'lucide-react';

interface IssueDetailViewProps {
  issueId: string;
  onBack: () => void;
  onNavigateToIssue: (id: string) => void;
}

export default function IssueDetailView({ issueId, onBack, onNavigateToIssue }: IssueDetailViewProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const docRef = doc(db, 'issues', issueId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Issue;
          setIssue({
            id: docSnap.id,
            ...data,
          });
          setComments(data.aiClassification?.comments || []); // Retrieve local comments array if configured, or fall back to mock
        } else {
          setIssue(null);
        }
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, `issues/${issueId}`);
      }
    );

    return () => unsubscribe();
  }, [issueId]);

  const hasVerified = () => {
    if (!issue || !auth.currentUser) return false;
    return issue.verifiedBy.includes(auth.currentUser.uid);
  };

  // Perform community verification
  const handleVerify = async () => {
    if (!issue || !auth.currentUser || verifying) return;
    setVerifying(true);

    try {
      const issueRef = doc(db, 'issues', issueId);
      const userUid = auth.currentUser.uid;

      // Add to verified list, increment count, and calculate if verification moves status to 'verified'
      const updatedVerifiedBy = [...issue.verifiedBy, userUid];
      const newCount = issue.verificationCount + 1;
      
      let nextStatus: IssueStatus = issue.status;
      // If verification threshold is reached (e.g., 5 verifications), escalate status to "verified"
      if (issue.status === 'reported' && newCount >= 3) {
        nextStatus = 'verified';
      }

      await updateDoc(issueRef, {
        verifiedBy: arrayUnion(userUid),
        verificationCount: increment(1),
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

      // Award 10 XP to verifier
      const userRef = doc(db, 'users', userUid);
      await updateDoc(userRef, {
        xp: increment(10),
        verificationsCount: increment(1),
      });

      // If we crossed threshold, award bonus 25 XP to the original reporter!
      if (nextStatus === 'verified' && issue.reportedBy) {
        const reporterRef = doc(db, 'users', issue.reportedBy);
        await updateDoc(reporterRef, {
          xp: increment(25),
        });
      }

    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  // Government action simulator for admin/government departments (SLA / status triggers)
  const handleGovtAction = async (nextStatus: IssueStatus) => {
    if (!issue) return;

    try {
      const issueRef = doc(db, 'issues', issueId);
      const updatePayload: any = {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };

      if (nextStatus === 'resolved') {
        updatePayload.resolvedAt = new Date().toISOString();

        // Award huge +100 XP to the citizen who filed it once resolved!
        if (issue.reportedBy) {
          const reporterRef = doc(db, 'users', issue.reportedBy);
          await updateDoc(reporterRef, {
            xp: increment(100),
            resolvedCount: increment(1),
          });
        }
      }

      await updateDoc(issueRef, updatePayload);
    } catch (err) {
      console.error('Govt action failed:', err);
    }
  };

  // Comment Posting Logic (stores in issue document array for high-speed sync)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !commentText.trim() || !auth.currentUser || submittingComment) return;
    setSubmittingComment(true);

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Citizen Hero',
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...comments, newComment];
      const issueRef = doc(db, 'issues', issueId);

      await updateDoc(issueRef, {
        'aiClassification.comments': updatedComments,
      });

      setCommentText('');
    } catch (err) {
      console.error('Comment submission failed:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?issueId=${issueId}`;
    if (navigator.share) {
      navigator.share({
        title: issue?.title || 'CivicPulse Report',
        text: `Check out this civic issue report: ${issue?.title}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Report link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white border border-slate-150 rounded-xl max-w-2xl mx-auto">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Retrieving ticket metadata...</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-20 bg-white border border-slate-150 rounded-xl max-w-2xl mx-auto space-y-4">
        <h3 className="font-bold text-slate-800 text-lg">Ticket Not Found</h3>
        <p className="text-xs text-slate-500">The requested civic ticket ID may have been deleted or archived.</p>
        <button onClick={onBack} className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer shadow">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6 pb-16">
      
      {/* Back button header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </button>
        <button onClick={handleShare} className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer">
          <Share2 className="w-3.5 h-3.5" /> Share Report
        </button>
      </div>

      {/* Hero photo */}
      <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-50">
        <img src={issue.imageUrl} alt={issue.title} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 z-10">
          <SeverityBadge severity={issue.severity} />
        </div>
        <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white font-mono text-[11px] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          SLA Goal: {new Date(issue.slaDeadline).toLocaleString()}
        </div>
      </div>

      {/* Core Details Area */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center text-xs font-mono text-slate-500">
          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-sm uppercase tracking-wide font-bold">
            {issue.category}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            Ward: {issue.ward}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Reported: {new Date(issue.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 leading-tight">
          {issue.title}
        </h1>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Citizen Description</p>
          <p className="text-sm text-slate-800 leading-relaxed font-normal">
            {issue.description}
          </p>
        </div>
      </div>

      {/* Dynamic Status Timeline Section */}
      <div className="border-t border-b border-slate-100 py-6">
        <StatusTimeline status={issue.status} updatedAt={issue.updatedAt} />
      </div>

      {/* AI Triage and Analysis Card */}
      <div className="bg-indigo-50/20 border border-indigo-150 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-sm">Autonomous Triage Analytics</h4>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase font-mono">
            Confidence: {Math.round((issue.aiClassification?.confidence || 0.95) * 100)}%
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed italic">
          "<strong>AI Diagnostic Reasoning:</strong> {issue.aiClassification?.reasoning || 'Automatically routed based on matching features detected in the high-resolution photo.'}"
        </p>
        <div className="grid grid-cols-2 gap-4 text-xs font-medium pt-1">
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Assigned Agency</span>
            <span className="text-slate-800 text-xs font-bold">{issue.department}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase tracking-wider text-[9px] block">Category Routing</span>
            <span className="text-slate-800 text-xs font-bold capitalize">{issue.category.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Citizen Verification & Govt actions block */}
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-150 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-0.5 text-center md:text-left">
          <h4 className="font-bold text-slate-800 text-sm">Community Crowdsourced Verification</h4>
          <p className="text-xs text-slate-500">
            {issue.verificationCount} citizens confirmed this report. Need 3 to auto-escalate status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Verify Button for Citizens */}
          <button
            onClick={handleVerify}
            disabled={hasVerified() || verifying}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs border shadow-sm transition-all duration-300 cursor-pointer ${
              hasVerified()
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 hover:shadow-md'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${hasVerified() ? 'fill-emerald-500 text-emerald-600' : ''}`} />
            {hasVerified() ? 'Verified by You (+10 XP)' : 'I See This Too (+10 XP)'}
          </button>
        </div>
      </div>

      {/* Govt / Admin simulator panel */}
      {auth.currentUser && (
        <div className="p-4 bg-orange-50/20 border border-orange-150 rounded-xl space-y-3">
          <h5 className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Government Department Simulator</h5>
          <p className="text-xs text-slate-600 leading-normal">
            (For testing, simulate department engineers taking physical action on this ticket)
          </p>
          <div className="flex flex-wrap gap-2">
            {['assigned', 'in_progress', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => handleGovtAction(st as IssueStatus)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer border transition ${
                  issue.status === st
                    ? 'bg-orange-600 text-white border-orange-700'
                    : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'
                }`}
              >
                Set {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments / Status updates section */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-400" /> Comments & Activity Updates ({comments.length})
        </h3>

        {/* Comment entry form */}
        {auth.currentUser ? (
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Post a status update or community comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-xl border border-slate-250 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:bg-white leading-normal transition bg-slate-50"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl cursor-pointer disabled:opacity-50 shadow transition flex items-center justify-center flex-shrink-0"
              title="Post Comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <p className="text-xs text-slate-400 italic">Sign in with Google to post comments or verify reports.</p>
        )}

        {/* Comments stream list */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No comments or activity logs yet. Be the first to start the conversation!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs font-mono text-slate-500">
                  <span className="font-bold text-slate-850">{comment.authorName}</span>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
