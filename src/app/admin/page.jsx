'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/StatusBadge';
import { Search, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';

export default function AdminTicketQueue() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('urgent');
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchQueue(isBg = false) {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (sortBy) params.append('sort', sortBy);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setMetrics(data.metrics || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBg) setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => fetchQueue(true), 5000);
    return () => clearInterval(interval);
  }, [statusFilter, categoryFilter, priorityFilter, sortBy, searchQuery]);

  function getAgeString(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-4 text-[#5E5E5E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Author Support Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming author queries with automated categorization, priority scoring, and Knowledge Base drafts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Queue Live
          </span>
          <button
            onClick={() => fetchQueue()}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded border border-slate-200 hover:bg-slate-50 transition"
            title="Refresh queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total Queue</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.total || 0}</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-amber-700 uppercase">Open</div>
          <div className="text-xl font-bold text-amber-700 mt-0.5">{metrics.openCount || 0}</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase">In Progress</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{metrics.inProgressCount || 0}</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-rose-200 bg-rose-50/30 shadow-xs">
          <div className="text-[10px] font-bold text-rose-700 uppercase">Critical SLA</div>
          <div className="text-xl font-bold text-rose-700 mt-0.5">{metrics.criticalCount || 0}</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-orange-200 bg-orange-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-orange-700 uppercase">High Priority</div>
          <div className="text-xl font-bold text-orange-700 mt-0.5">{metrics.highCount || 0}</div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-700 uppercase">Resolved</div>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{metrics.resolvedCount || 0}</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center text-xs">
          <div className="md:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword, author, ticket #..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F16877] text-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 truncate"
            >
              <option value="all">All Categories</option>
              <option value="Royalty & Payments">Royalty &amp; Payments</option>
              <option value="ISBN & Metadata Issues">ISBN &amp; Metadata Issues</option>
              <option value="Printing & Quality">Printing &amp; Quality</option>
              <option value="Distribution & Availability">Distribution &amp; Availability</option>
              <option value="Book Status & Production Updates">Book Status &amp; Production</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          <div className="md:col-span-1.5">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="md:col-span-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium text-slate-900"
            >
              <option value="urgent">Urgent First</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          Loading operations queue...
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
          No tickets found matching the selected filters.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {tickets.map((t) => {
            const isCritical = t.priority === 'Critical' && (t.status === 'Open' || t.status === 'In Progress');

            return (
              <Link
                key={t._id}
                href={`/admin/tickets/${t._id}`}
                className={`block p-4 hover:bg-slate-50 transition ${
                  isCritical ? 'border-l-4 border-l-rose-500 bg-rose-50/20' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {t.ticket_number}
                      </span>
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      <CategoryBadge category={t.category} />

                      {t.category_overridden && (
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Cat. Overridden
                        </span>
                      )}
                    </div>

                    <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      {t.subject}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center space-x-2 flex-wrap">
                      <span>Author: <strong className="text-slate-700">{t.author_name}</strong></span>
                      <span>·</span>
                      <span>Book: <strong>{t.book_title}</strong></span>
                      <span>·</span>
                      <span>Assigned: <strong>{t.assigned_name || t.assigned_to}</strong></span>
                      <span>·</span>
                      <span>{t.messages?.length || 0} msgs</span>
                      {t.internal_notes?.length > 0 && (
                        <span className="text-amber-700 font-semibold">
                          ({t.internal_notes.length} notes)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400 shrink-0">
                    <span>{getAgeString(t.created_at)}</span>
                    <span className="font-semibold text-[#F16877] inline-flex items-center">
                      Review <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
