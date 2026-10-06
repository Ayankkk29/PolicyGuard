'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, PlusCircle, RefreshCw, ArrowUpDown } from 'lucide-react';
import { fetchClaims } from '@/lib/api';
import { Claim } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function ClaimsListPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await fetchClaims({
        search,
        status: statusFilter,
        category: categoryFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setClaims(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [search, statusFilter, categoryFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expense Claims Directory</h1>
          <p className="text-sm text-slate-500 font-medium">
            Search, filter, and inspect employee expense claims
          </p>
        </div>
        <Link
          href="/claims/new"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Claim
        </Link>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search claimant name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg py-1.5 px-3 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="AI_REVIEWED">AI Reviewed</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="REQUIRES_CLARIFICATION">Requires Clarification</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-slate-300 rounded-lg py-1.5 px-3 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="Meals">Meals</option>
            <option value="Accommodation">Accommodation</option>
            <option value="Transportation">Transportation</option>
            <option value="Travel">Travel</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort:
          </label>
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('_');
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="border border-slate-300 rounded-lg py-1.5 px-3 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          >
            <option value="created_at_desc">Newest First</option>
            <option value="created_at_asc">Oldest First</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
            <option value="date_desc">Expense Date: Recent First</option>
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-slate-500 gap-2 text-xs font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            Loading claims...
          </div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No claims found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Claimant</th>
                  <th className="px-6 py-3.5">Expense Date</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Receipt</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-indigo-700 font-mono">#{claim.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{claim.claimant}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{claim.date}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold border border-slate-200">
                        {claim.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{claim.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      {claim.receipt_available ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                          Yes
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-medium border border-rose-200">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={claim.description}>
                      {claim.description}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={claim.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs shadow-xs transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
