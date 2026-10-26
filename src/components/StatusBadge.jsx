import React from 'react';

export function StatusBadge({ status }) {
  const config = {
    Open: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
    },
    'In Progress': {
      bg: 'bg-brand-50',
      text: 'text-brand-800',
      border: 'border-brand-200',
      dot: 'bg-brand-500',
    },
    Resolved: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
    Closed: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
  };

  const item = config[status] || config.Open;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${item.bg} ${item.text} ${item.border}`}
    >
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${item.dot}`}></span>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const config = {
    Critical: {
      bg: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
      bar: 'bg-rose-600',
    },
    High: {
      bg: 'bg-orange-50 text-orange-900 border-orange-300 font-semibold',
      bar: 'bg-orange-500',
    },
    Medium: {
      bg: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
      bar: 'bg-slate-400',
    },
    Low: {
      bg: 'bg-slate-50 text-slate-600 border-slate-200 font-normal',
      bar: 'bg-slate-300',
    },
  };

  const item = config[priority] || config.Medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${item.bg}`}
    >
      <span className={`w-1 h-3 mr-1.5 rounded-full ${item.bar}`}></span>
      {priority}
    </span>
  );
}

export function CategoryBadge({ category }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {category}
    </span>
  );
}
