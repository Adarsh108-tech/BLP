'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/StatusBadge';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Lock,
  RefreshCw,
  CheckCircle2,
  Paperclip,
  BookOpen,
  UserCheck
} from 'lucide-react';

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function AdminTicketDetail() {
  const params = useParams();
  const { id } = params;

  const [ticket, setTicket] = useState(null);
  const [authorBooks, setAuthorBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  async function fetchTicketData() {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (data.success && data.ticket) {
        setTicket(data.ticket);
        if (!replyMessage && data.ticket.ai_draft_response) {
          setReplyMessage(data.ticket.ai_draft_response);
        }

        if (data.ticket.author_id) {
          const bookRes = await fetch(`/api/books?author_id=${data.ticket.author_id}`);
          const bookData = await bookRes.json();
          if (bookData.success && bookData.books) {
            setAuthorBooks(bookData.books);
          }
        }
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleUpdateMetadata(field, value) {
    setUpdatingMetadata(true);
    try {
      const body = { [field]: value };
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setTicket(data.ticket);
        showToast(`Updated ${field}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingMetadata(false);
    }
  }

  async function handleAssignToMe() {
    handleUpdateMetadata('assigned_to', 'Current Admin');
  }

  async function handleRegenerateAIDraft() {
    setRegeneratingDraft(true);
    try {
      const res = await fetch(`/api/tickets/${id}/ai-draft`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.draft) {
        setTicket((prev) => ({ ...prev, ai_draft_response: data.draft }));
        setReplyMessage(data.draft);
        showToast('Fresh draft generated');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRegeneratingDraft(false);
    }
  }

  async function handleSendReply(shouldResolve = false) {
    if (!replyMessage.trim()) return;
    setSubmittingReply(true);

    try {
      const res = await fetch(`/api/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
          resolve: shouldResolve,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTicket(data.ticket);
        setReplyMessage('');
        showToast(shouldResolve ? 'Resolved & sent' : 'Response dispatched');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!internalNote.trim()) return;
    setSubmittingNote(true);

    try {
      const res = await fetch(`/api/tickets/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: internalNote.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setTicket((prev) => ({
          ...prev,
          internal_notes: data.internal_notes,
        }));
        setInternalNote('');
        showToast('Note added');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingNote(false);
    }
  }

  if (loading) {
    return <div className="py-24 text-center text-xs text-slate-500">Loading ticket workspace...</div>;
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 text-xs">
        <h2 className="text-base font-bold text-slate-900">Ticket Not Found</h2>
        <Link href="/admin" className="text-[#F16877] font-semibold underline mt-1 inline-block">
          Return to Queue
        </Link>
      </div>
    );
  }

  const selectedBook = authorBooks.find((b) => b.book_id === ticket.book_id);

  return (
    <div className="space-y-4 text-[#5E5E5E]">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-3.5 py-2 rounded-md shadow-lg text-xs flex items-center space-x-2 border border-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <Link
          href="/admin"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Queue
        </Link>

        <button
          onClick={() => fetchTicketData()}
          className="p-1 text-slate-400 hover:text-slate-600 rounded border border-slate-200 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Messages & Draft Workbench (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Ticket Summary */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {ticket.ticket_number}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <CategoryBadge category={ticket.category} />
                </div>
                <h1 className="text-lg font-bold text-slate-900">{ticket.subject}</h1>
              </div>

              <div className="text-[11px] text-slate-400 shrink-0">
                {new Date(ticket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            </div>

            {/* Author details strip */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs flex flex-wrap justify-between gap-2">
              <div>
                <strong className="text-slate-900">{ticket.author_name}</strong>
                <span className="text-slate-500"> ({ticket.author_id}) · {ticket.author_email}</span>
              </div>
              <div className="text-slate-600">
                Book: <strong className="text-slate-900">{ticket.book_title}</strong>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>

            {ticket.attachment_name && (
              <div className="pt-1">
                <span className="inline-flex items-center text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                  <Paperclip className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Attachment: <strong className="ml-1 text-slate-800">{ticket.attachment_name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Book Catalog Context (if book selected) */}
          {selectedBook && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500 font-semibold uppercase text-[10px]">
                <span className="flex items-center text-slate-900 font-bold">
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  {selectedBook.title}
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedBook.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">ISBN</span>
                  <div className="font-mono font-bold text-slate-900 truncate">{selectedBook.isbn || 'TBD'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Sold Units</span>
                  <div className="font-bold text-slate-900">{selectedBook.total_copies_sold}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Earned</span>
                  <div className="font-bold text-slate-900">₹{selectedBook.total_royalty_earned}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Pending</span>
                  <div className="font-bold text-[#F16877]">₹{selectedBook.royalty_pending}</div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation Stream */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700">
              Message History ({ticket.messages?.length || 0})
            </div>

            <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
              {ticket.messages?.map((msg, index) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-1 px-1">
                      <strong className="text-slate-700">
                        {isAdmin ? `${msg.sender_name} (Admin)` : `${msg.sender_name} (Author)`}
                      </strong>
                      <span> · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed shadow-xs ${
                        isAdmin
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-900 border border-slate-200'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Response Assistant Panel */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                <Sparkles className="w-3.5 h-3.5 text-[#F16877]" />
                <span>AI Drafted Response</span>
                <span className="text-[10px] font-normal text-slate-500">(BookLeaf Grounded)</span>
              </div>

              <button
                type="button"
                onClick={handleRegenerateAIDraft}
                disabled={regeneratingDraft}
                className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${regeneratingDraft ? 'animate-spin' : ''}`} />
                {regeneratingDraft ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>

            <div className="p-4 space-y-3">
              <textarea
                rows={8}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Compose reply to author..."
                className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F16877] text-slate-900 leading-relaxed font-sans"
              />

              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReplyMessage(ticket.ai_draft_response)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Reset to Original Draft
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendReply(false)}
                    disabled={submittingReply || !replyMessage.trim()}
                    className="px-3.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                  >
                    Send (In Progress)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendReply(true)}
                    disabled={submittingReply || !replyMessage.trim()}
                    className="px-4 py-1.5 rounded-md bg-[#F16877] hover:bg-[#e04c5d] text-white text-xs font-semibold shadow-sm transition flex items-center"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Send &amp; Resolve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Triage & Internal Notes (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Triage Overrides Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100">
              Triage &amp; Status
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Category
              </label>
              <select
                value={ticket.category}
                onChange={(e) => handleUpdateMetadata('category', e.target.value)}
                disabled={updatingMetadata}
                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-900 font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {ticket.category_overridden && (
                <div className="text-[10px] text-amber-700 mt-0.5">
                  Overridden from: {ticket.ai_category}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Priority
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => handleUpdateMetadata('priority', e.target.value)}
                disabled={updatingMetadata}
                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-900 font-semibold"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {ticket.priority_overridden && (
                <div className="text-[10px] text-amber-700 mt-0.5">
                  Overridden from: {ticket.ai_priority}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Status
              </label>
              <select
                value={ticket.status}
                onChange={(e) => handleUpdateMetadata('status', e.target.value)}
                disabled={updatingMetadata}
                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-900 font-bold"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                Assignee
              </label>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 mb-1.5">
                <span className="font-semibold text-slate-900">{ticket.assigned_name || ticket.assigned_to}</span>
              </div>
              <button
                type="button"
                onClick={handleAssignToMe}
                disabled={updatingMetadata}
                className="w-full py-1 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-50 transition flex items-center justify-center text-slate-700"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Assign to Me
              </button>
            </div>

            {ticket.ai_confidence_reasoning && (
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">AI Rationale:</span> {ticket.ai_confidence_reasoning}
              </div>
            )}
          </div>

          {/* Internal Private Notes */}
          <div className="bg-white rounded-lg border border-amber-300 shadow-xs overflow-hidden text-xs">
            <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center uppercase text-[10px] tracking-wider">
                <Lock className="w-3 h-3 mr-1 text-amber-700" />
                Internal Notes (Private)
              </span>
              <span className="text-[10px] text-amber-800 font-semibold">Not visible to author</span>
            </div>

            <div className="p-3 space-y-2.5">
              {ticket.internal_notes?.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {ticket.internal_notes.map((n, i) => (
                    <div key={i} className="p-2 rounded bg-amber-50/40 border border-amber-100 text-[11px]">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                        <strong className="text-slate-800">{n.admin_name}</strong>
                        <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-slate-700">{n.note}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-slate-400 italic text-[11px]">
                  No internal notes recorded.
                </div>
              )}

              <form onSubmit={handleAddNote} className="space-y-1.5 pt-1 border-t border-slate-100">
                <input
                  type="text"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Record ICICI payout batch or printer update..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                />
                <button
                  type="submit"
                  disabled={submittingNote || !internalNote.trim()}
                  className="w-full py-1 rounded bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold text-xs transition"
                >
                  Save Note
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
