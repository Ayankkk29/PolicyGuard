'use client';

import React, { useEffect, useState } from 'react';
import { History, RefreshCw, Filter, Search } from 'lucide-react';
import { fetchGlobalAuditLogs } from '@/lib/api';
import { AuditLog } from '@/lib/types';
import { AuditTimeline } from '@/components/AuditTimeline';

export default function GlobalAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchClaimId, setSearchClaimId] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    if (searchClaimId && l.claim_id?.toString() !== searchClaimId.trim()) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            System Audit Trail History
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Complete immutable log of all claim intake, validation, AI analysis, and reviewer actions
          </p>
        </div>
        <button
          onClick={loadAuditLogs}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Logs
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Claim ID Search */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Filter Claim ID:</label>
          <input
            type="text"
            placeholder="e.g. 1"
            value={searchClaimId}
            onChange={(e) => setSearchClaimId(e.target.value)}
            className="w-28 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
          />
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Action Type:
          </label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="border border-slate-300 rounded-lg py-1.5 px-3 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          >
            <option value="ALL">All Actions</option>
            <option value="CLAIM_CREATED">CLAIM_CREATED</option>
            <option value="DETERMINISTIC_VALIDATED">DETERMINISTIC_VALIDATED</option>
            <option value="POLICY_RETRIEVED">POLICY_RETRIEVED</option>
            <option value="AI_REVIEWED">AI_REVIEWED</option>
            <option value="REVIEWER_APPROVED">REVIEWER_APPROVED</option>
            <option value="REVIEWER_REJECTED">REVIEWER_REJECTED</option>
            <option value="CLARIFICATION_REQUESTED">CLARIFICATION_REQUESTED</option>
            <option value="CLASSIFICATION_OVERRIDDEN">CLASSIFICATION_OVERRIDDEN</option>
            <option value="POLICY_CREATED">POLICY_CREATED</option>
          </select>
        </div>
      </div>

      {/* Timeline Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-8">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-500 gap-2 text-xs font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            Loading audit logs...
          </div>
        ) : (
          <AuditTimeline logs={filteredLogs} />
        )}
      </div>
    </div>
  );
}
