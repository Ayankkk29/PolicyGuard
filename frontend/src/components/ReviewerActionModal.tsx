'use client';

import React, { useState } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';

interface ReviewerActionModalProps {
  isOpen: boolean;
  actionType: 'REJECT' | 'CLARIFICATION' | 'OVERRIDE' | null;
  onClose: () => void;
  onSubmit: (data: { reason?: string; message?: string; newCategory?: string }) => Promise<void>;
  currentCategory?: string;
}

const CATEGORY_OPTIONS = ['Meals', 'Accommodation', 'Transportation', 'Travel', 'General', 'Office Supplies', 'Software'];

export const ReviewerActionModal: React.FC<ReviewerActionModalProps> = ({
  isOpen,
  actionType,
  onClose,
  onSubmit,
  currentCategory
}) => {
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [newCategory, setNewCategory] = useState('Transportation');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !actionType) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (actionType === 'REJECT' && !reason.trim()) {
      setError('A rejection reason is mandatory.');
      return;
    }

    if (actionType === 'CLARIFICATION' && !message.trim()) {
      setError('A clarification request message is mandatory.');
      return;
    }

    if (actionType === 'OVERRIDE') {
      if (!newCategory.trim()) {
        setError('New category selection is required.');
        return;
      }
      if (!reason.trim()) {
        setError('An explanation reason for overriding AI classification is mandatory.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        reason: reason.trim(),
        message: message.trim(),
        newCategory: newCategory.trim()
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 text-base">
            {actionType === 'REJECT' && 'Reject Expense Claim'}
            {actionType === 'CLARIFICATION' && 'Request Clarification from Claimant'}
            {actionType === 'OVERRIDE' && 'Override AI Expense Classification'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {actionType === 'REJECT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Explain why this claim violates expense policy (e.g. Exceeds daily meal limit of ₹2,000 without prior authorization)..."
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-slate-800"
              />
            </div>
          )}

          {actionType === 'CLARIFICATION' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Clarification Message to Claimant <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Specify what additional information or documents are required (e.g. Please clarify if dinner included clients and specify their names)..."
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800"
              />
            </div>
          )}

          {actionType === 'OVERRIDE' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                Current Classification: <strong>{currentCategory || 'Meals'}</strong>.
                Overriding will update the claim category and re-run policy checks. Original AI prediction record is permanently preserved for audit.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  New Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-800 font-medium"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Override Justification Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why the AI classification was overridden (e.g. Description was ambiguous; receipt confirms expense was for airport taxi transport)..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800"
                />
              </div>
            </>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 ${
                actionType === 'REJECT'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm {actionType === 'REJECT' ? 'Rejection' : actionType === 'CLARIFICATION' ? 'Request' : 'Override'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
