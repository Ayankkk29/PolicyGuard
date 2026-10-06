'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { submitClaim } from '@/lib/api';

export default function SubmitClaimPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    claimant: '',
    date: '2026-10-02',
    category: 'Meals',
    amount: '',
    currency: 'INR',
    description: '',
    receipt_available: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (!formData.claimant.trim()) {
      setError('Claimant name is required.');
      return;
    }
    if (!formData.date) {
      setError('Expense date is required.');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Claim amount must be a positive number greater than zero.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Expense description is required.');
      return;
    }

    setLoading(true);

    try {
      const createdClaim = await submitClaim({
        claimant: formData.claimant.trim(),
        date: formData.date,
        category: formData.category,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description.trim(),
        receipt_available: formData.receipt_available
      });

      // Redirect to newly created claim review page
      router.push(`/claims/${createdClaim.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit expense claim.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/claims"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Claims List
      </Link>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Submit New Expense Claim</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Enter claim details to run deterministic checks and AI policy review workflow
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Claimant Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Claimant Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="claimant"
              placeholder="e.g. Rahul Sharma"
              value={formData.claimant}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 font-medium"
            />
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
              >
                <option value="Meals">Meals</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Transportation">Transportation</option>
                <option value="Travel">Travel</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Amount & Currency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Claim Amount <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                name="amount"
                placeholder="e.g. 1850"
                value={formData.amount}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-900 font-medium"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Expense Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="e.g. Dinner with client at hotel"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
            />
          </div>

          {/* Receipt Available Checkbox */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-lg p-4">
            <input
              type="checkbox"
              id="receipt_available"
              name="receipt_available"
              checked={formData.receipt_available}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="receipt_available" className="text-xs font-semibold text-slate-800 select-none cursor-pointer">
              Supporting Receipt Available & Attached
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Validations & AI Policy Analysis...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Claim for Policy Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
