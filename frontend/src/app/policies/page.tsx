'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Upload, Search, CheckCircle2, FileText, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchPolicies, importPolicyText } from '@/lib/api';
import { Policy, PolicySection } from '@/lib/types';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Import form state
  const [importName, setImportName] = useState('Travel & Expense Policy');
  const [importVersion, setImportVersion] = useState('2.2');
  const [importEffectiveDate, setImportEffectiveDate] = useState('2026-11-01');
  const [importText, setImportText] = useState(`Section 1.1: General Rules
All claims must be submitted with valid date and receipts.

Section 2.1: Meal Expenses
Meal expenses are limited to ₹2,500 per day with receipts.

Section 3.1: Accommodation
Hotel lodging is limited to ₹6,000 per night with original itemized bill.`);

  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await fetchPolicies();
      setPolicies(data);
      if (data.length > 0) {
        setSelectedPolicy(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!importName.trim() || !importVersion.trim() || !importText.trim()) {
      setError('All fields are required.');
      return;
    }

    setImporting(true);
    try {
      await importPolicyText({
        name: importName.trim(),
        version: importVersion.trim(),
        effective_date: importEffectiveDate,
        raw_text: importText.trim()
      });
      setShowImportModal(false);
      await loadPolicies();
    } catch (err: any) {
      setError(err.message || 'Failed to import policy.');
    } finally {
      setImporting(false);
    }
  };

  const filteredSections = selectedPolicy
    ? selectedPolicy.sections.filter(
        (sec) =>
          sec.title.toLowerCase().includes(search.toLowerCase()) ||
          sec.content.toLowerCase().includes(search.toLowerCase()) ||
          sec.section_number.includes(search)
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organizational Expense Policies</h1>
          <p className="text-sm text-slate-500 font-medium">
            Inspect, manage, and import organizational expense guidelines used for AI review
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 flex items-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4" />
          Import New Policy Document
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center text-slate-500 gap-2 text-xs font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          Loading policy library...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Policy List Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Policy Versions ({policies.length})
            </h2>
            <div className="space-y-2">
              {policies.map((pol) => (
                <button
                  key={pol.id}
                  onClick={() => setSelectedPolicy(pol)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedPolicy?.id === pol.id
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs ring-1 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm">{pol.name}</span>
                    <span className="text-xs font-bold text-indigo-700 font-mono bg-indigo-100 px-2 py-0.5 rounded">
                      v{pol.version}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span>Effective: {pol.effective_date}</span>
                    {pol.is_active ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="text-slate-400">Archived</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section Details (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedPolicy ? (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{selectedPolicy.name}</h2>
                      <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded text-xs">
                        v{selectedPolicy.version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{selectedPolicy.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedPolicy.sections.length} Policy Sections
                  </span>
                </div>

                {/* Section Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search policy section title, content, or section number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Section Cards */}
                <div className="space-y-4">
                  {filteredSections.map((sec) => (
                    <div key={sec.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="bg-slate-800 text-white font-mono px-2 py-0.5 rounded text-xs">
                            {sec.section_number}
                          </span>
                          <span>{sec.title}</span>
                        </div>
                        {sec.category && (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded font-medium">
                            Tag: {sec.category}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-mono bg-white p-3 rounded border border-slate-200/80">
                        {sec.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-500">
                Select a policy version to view sections.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Policy Document Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Import Policy Document</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Policy Name</label>
                  <input
                    type="text"
                    value={importName}
                    onChange={(e) => setImportName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Version</label>
                  <input
                    type="text"
                    value={importVersion}
                    onChange={(e) => setImportVersion(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Effective Date</label>
                <input
                  type="date"
                  value={importEffectiveDate}
                  onChange={(e) => setImportEffectiveDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Raw Policy Document Text</label>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Paste policy document sections..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  {importing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Import & Set Active</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
