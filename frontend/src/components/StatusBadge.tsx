import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <FileText className="w-3.5 h-3.5 mr-1" />;
  let label = status;

  switch (normalized) {
    case 'APPROVED':
    case 'PASS':
    case 'COMPLIANT':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />;
      break;
    case 'REJECTED':
    case 'FAIL':
    case 'NON_COMPLIANT':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      icon = <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />;
      break;
    case 'NEEDS_REVIEW':
    case 'WARNING':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      icon = <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />;
      label = status === 'NEEDS_REVIEW' ? 'Needs Review' : status;
      break;
    case 'REQUIRES_CLARIFICATION':
    case 'UNCERTAIN':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      icon = <HelpCircle className="w-3.5 h-3.5 mr-1 text-indigo-600" />;
      label = status === 'REQUIRES_CLARIFICATION' ? 'Requires Clarification' : status;
      break;
    case 'AI_REVIEWED':
    case 'CONFIDENT':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      icon = <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />;
      label = status === 'AI_REVIEWED' ? 'AI Reviewed' : status;
      break;
    case 'PENDING':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      icon = <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />;
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center rounded-full border ${colorClasses} ${sizeClasses}`}>
      {icon}
      {label}
    </span>
  );
};
