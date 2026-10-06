import React from 'react';
import { AuditLog } from '@/lib/types';
import { Clock, User, ArrowRight, Info } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-slate-500 text-sm italic py-4 text-center">
        No audit log history recorded yet.
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 py-2 space-y-6">
      {logs.map((log) => {
        const dateStr = new Date(log.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        return (
          <div key={log.id} className="relative pl-6 group">
            {/* Timeline Dot */}
            <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100 group-hover:scale-110 transition-transform" />

            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  {log.action}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {dateStr}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium mb-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Actor: <strong className="text-slate-900">{log.actor}</strong></span>
              </div>

              {(log.old_value || log.new_value) && (
                <div className="text-xs bg-white border border-slate-200 rounded p-2 my-2 space-y-1 font-mono text-slate-700">
                  {log.old_value && (
                    <div className="flex items-center gap-1 text-slate-500 line-through">
                      <span>Prev:</span>
                      <span>{log.old_value}</span>
                    </div>
                  )}
                  {log.new_value && (
                    <div className="flex items-center gap-1 text-slate-900 font-semibold">
                      <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span>New:</span>
                      <span>{log.new_value}</span>
                    </div>
                  )}
                </div>
              )}

              {log.reason && (
                <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 rounded p-2 mt-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Reason/Notes:</strong> {log.reason}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
