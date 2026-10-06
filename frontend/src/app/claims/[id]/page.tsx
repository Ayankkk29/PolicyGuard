'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Clock, 
  RefreshCw,
  User,
  Quote
} from 'lucide-react';

import { 
  fetchClaimDetail, 
  approveClaim, 
  rejectClaim, 
  requestClarification, 
  overrideCategory 
} from '@/lib/api';
import { ClaimDetailResponse } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { ReviewerActionModal } from '@/components/ReviewerActionModal';
import { AuditTimeline } from '@/components/AuditTimeline';

export default function ClaimReviewPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const [data, setData] = useState<ClaimDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalAction, setModalAction] = useState<'REJECT' | 'CLARIFICATION' | 'OVERRIDE' | null>(null);

  const loadClaim = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchClaimDetail(claimId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load claim review details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claimId) loadClaim();
  }, [claimId]);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to APPROVE this expense claim?')) return;
    try {
      await approveClaim(Number(claimId), 'John Doe (Senior Manager)', 'Approved after manual policy compliance verification.');
      await loadClaim();
    } catch (err: any) {
      alert(err.message || 'Failed to approve claim');
    }
  };

  const handleModalSubmit = async (payload: { reason?: string; message?: string; newCategory?: string }) => {
    if (modalAction === 'REJECT') {
      await rejectClaim(Number(claimId), 'John Doe (Senior Manager)', payload.reason || '');
    } else if (modalAction === 'CLARIFICATION') {
      await requestClarification(Number(claimId), 'John Doe (Senior Manager)', payload.message || '');
    } else if (modalAction === 'OVERRIDE') {
      await overrideCategory(Number(claimId), 'John Doe (Senior Manager)', payload.newCategory || '', payload.reason || '');
    }
    await loadClaim();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading Claim Review Workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2 text-rose-900">
          <XCircle className="w-5 h-5 text-rose-600" />
          Error Loading Claim #{claimId}
        </h3>
        <p className="text-sm">{error || 'Claim record not found.'}</p>
        <Link
          href="/claims"
          className="inline-block px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg"
        >
          Return to Claims List
        </Link>
      </div>
    );
  }

  const { claim, validations, review, decisions, audit_logs } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/claims"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Claim #{claim.id}</h1>
              <StatusBadge status={claim.status} size="lg" />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Submitted by <strong>{claim.claimant}</strong> on {claim.date}
            </p>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={handleApprove}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>

          <button
            onClick={() => setModalAction('REJECT')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>

          <button
            onClick={() => setModalAction('CLARIFICATION')}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 flex items-center gap-1.5 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            Request Clarification
          </button>

          <button
            onClick={() => setModalAction('OVERRIDE')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Override Category
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (Claim & Validations), Right Column (AI Reasoning & Policy Evidence) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Claim Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              Submitted Claim Details
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Claimant</span>
                <span className="font-bold text-slate-900 text-sm">{claim.claimant}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Expense Date</span>
                <span className="font-semibold text-slate-800">{claim.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="inline-block bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded border border-slate-200 mt-0.5">
                  {claim.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Amount</span>
                <span className="font-bold text-slate-900 text-base">
                  {claim.currency} {claim.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-xs font-medium mb-1">Receipt Status</span>
              {claim.receipt_available ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Supporting Receipt Attached & Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  No Receipt Provided
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-xs font-medium mb-1">Claim Description</span>
              <p className="text-xs text-slate-800 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200/70 italic">
                "{claim.description}"
              </p>
            </div>
          </div>

          {/* Deterministic Validation Results */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Deterministic Rule Validations
            </h2>

            <div className="space-y-3">
              {validations.map((v) => (
                <div key={v.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      {v.check_type.replace('_', ' ')}
                    </span>
                    <StatusBadge status={v.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{v.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Reasoning Card */}
          {review && (
            <div className="bg-white rounded-xl border border-indigo-100 shadow-xs p-6 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">PolicyGuard AI Analysis</h2>
                    <p className="text-xs text-slate-500">Evaluated against active organizational policy v2.1</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Confidence Score</div>
                  <div className="text-xl font-extrabold text-indigo-700">
                    {(review.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Classification Status Pill */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-500">Classification Status:</span>
                {review.uncertain ? (
                  <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full text-xs border border-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    UNCERTAIN CLASSIFICATION
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    CONFIDENT (Predicted: {review.ai_category || claim.category})
                  </span>
                )}
              </div>

              {/* Uncertain Alert Callout */}
              {review.uncertain && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    Uncertain AI Classification Warning
                  </div>
                  <p>
                    The AI classifier could not confidently categorize this claim description with high certainty. Reviewer discretion or claimant clarification is required.
                  </p>
                </div>
              )}

              {/* AI Reasoning Explanation */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  AI Finding & Reasoning
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg font-medium">
                  {review.explanation}
                </p>
              </div>

              {/* Missing Information Callout */}
              {review.missing_information && review.missing_information.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Missing Required Information
                  </h3>
                  <ul className="list-disc list-inside text-xs text-rose-800 space-y-1 font-medium">
                    {review.missing_information.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Policy Evidence Citations */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Policy Evidence Citations ({review.evidences.length})
                </h3>

                {review.evidences.map((ev) => (
                  <div key={ev.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                          Section {ev.section_number}
                        </span>
                        <span>{ev.section_title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {ev.policy_name} v{ev.policy_version}
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-slate-700 bg-white p-3 rounded border border-slate-200 italic font-mono">
                      <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>"{ev.evidence_text}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Decisions History */}
          {decisions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Reviewer Decisions History
              </h2>
              <div className="space-y-2">
                {decisions.map((d) => (
                  <div key={d.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {d.decision} {d.override_category ? `→ ${d.override_category}` : ''}
                      </span>
                      <span className="text-slate-400 text-[11px]">{new Date(d.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600">Reviewer: <strong>{d.reviewer}</strong></p>
                    <p className="text-slate-800 font-medium">Reason: {d.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log Sequential Timeline */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              Complete Audit Log History
            </h2>
            <AuditTimeline logs={audit_logs} />
          </div>
        </div>
      </div>

      {/* Reviewer Action Modal */}
      <ReviewerActionModal
        isOpen={modalAction !== null}
        actionType={modalAction}
        onClose={() => setModalAction(null)}
        onSubmit={handleModalSubmit}
        currentCategory={claim.category}
      />
    </div>
  );
}
