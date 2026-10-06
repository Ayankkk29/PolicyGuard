'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle, 
  IndianRupee, 
  PlusCircle, 
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { fetchDashboardStats, fetchClaims } from '@/lib/api';
import { DashboardStats, Claim } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, claimsData] = await Promise.all([
        fetchDashboardStats(),
        fetchClaims({ sort_by: 'created_at', sort_order: 'desc' })
      ]);
      setStats(statsData);
      setRecentClaims(claimsData.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server. Make sure FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading PolicyGuard Dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2 text-rose-900">
          <XCircle className="w-5 h-5 text-rose-600" />
          Backend Connection Failure
        </h3>
        <p className="text-sm">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Claim Overview</h1>
          <p className="text-sm text-slate-500 font-medium">
            Automated policy validation and AI-assisted compliance analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-xs flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            Refresh
          </button>
          <Link
            href="/claims/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Submit New Claim
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Claims */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Claims</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_claims || 0}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Total claimed: <strong className="text-slate-800">₹{(stats?.total_amount || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700">{stats?.pending_reviews || 0}</div>
          <div className="text-xs text-blue-600/80 mt-1 font-medium">Awaiting reviewer decision</div>
        </div>

        {/* Needs Review / Flags */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Policy Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats?.needs_review || 0}</div>
          <div className="text-xs text-amber-600/80 mt-1 font-medium">Limit breaches or policy flags</div>
        </div>

        {/* Approved Claims */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Claims</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats?.approved_claims || 0}</div>
          <div className="text-xs text-emerald-600/80 mt-1 font-medium">Fully processed & approved</div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requires Clarification</div>
            <div className="text-xl font-bold text-indigo-900">{stats?.requires_clarification || 0} Claims</div>
            <div className="text-xs text-slate-500">Vague descriptions or missing proof requested from claimant</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected Claims</div>
            <div className="text-xl font-bold text-rose-900">{stats?.rejected_claims || 0} Claims</div>
            <div className="text-xs text-slate-500">Non-compliant expenses with explicit reviewer reason</div>
          </div>
        </div>
      </div>

      {/* Category Spend Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Category Spend & Claim Volumes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats?.category_breakdown.map((cat) => (
            <div key={cat.category} className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{cat.category}</div>
              <div className="text-lg font-bold text-slate-900">₹{cat.total_amount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-slate-500 font-medium">{cat.count} claim(s)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Expense Claims</h2>
          <Link
            href="/claims"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All Claims
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Claim ID</th>
                <th className="px-6 py-3">Claimant</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Receipt</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-indigo-700 font-mono">#{claim.id}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-900">{claim.claimant}</td>
                  <td className="px-6 py-3.5 text-slate-500">{claim.date}</td>
                  <td className="px-6 py-3.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                      {claim.category}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    ₹{claim.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-3.5">
                    {claim.receipt_available ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                        Attached
                      </span>
                    ) : (
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-medium border border-rose-200">
                        Missing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={claim.status} size="sm" />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={`/claims/${claim.id}`}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-xs border border-indigo-200 transition-colors"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
