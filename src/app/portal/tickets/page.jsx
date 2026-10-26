'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatusBadge, PriorityBadge, CategoryBadge } from '@/components/StatusBadge';
import { Send, MessageSquare, AlertCircle, RefreshCw, Paperclip } from 'lucide-react';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState('');

  async function fetchTickets(isBackground = false) {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
        if (!selectedTicketId && data.tickets.length > 0 && !isBackground) {
          setSelectedTicketId(data.tickets[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => fetchTickets(true), 4000);
    return () => clearInterval(interval);
  }, [selectedTicketId]);

  const activeTicket = tickets.find((t) => t._id === selectedTicketId) || tickets[0] || null;

  async function handleSendReply(e) {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    setSendingReply(true);
    setError('');

    try {
      const res = await fetch(`/api/tickets/${activeTicket._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyMessage.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      setReplyMessage('');
      await fetchTickets(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <div className="space-y-4 text-[#5E5E5E]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Support Queries &amp; History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active tickets and direct responses from the BookLeaf operations team.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Sync Active
          </span>
          <button
            onClick={() => fetchTickets()}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded border border-slate-200 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          Loading support tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-slate-300 p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No Tickets Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
              You haven't submitted any queries yet.
            </p>
          </div>
          <Link
            href="/portal/submit"
            className="inline-flex items-center px-3.5 py-1.5 rounded bg-[#F16877] text-white text-xs font-semibold hover:bg-[#e04c5d] transition"
          >
            Submit First Query
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Tickets List */}
          <div className="lg:col-span-5 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
              Tickets ({tickets.length})
            </div>

            <div className="space-y-1.5">
              {tickets.map((t) => {
                const isSelected = activeTicket?._id === t._id;
                return (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTicketId(t._id)}
                    className={`w-full text-left p-3.5 rounded-lg border transition text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#F16877] shadow-sm ring-1 ring-[#F16877]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          {t.ticket_number}
                        </span>
                        <StatusBadge status={t.status} />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 truncate mb-1">
                      {t.subject}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span className="truncate max-w-[180px]">{t.book_title}</span>
                      <span className="font-mono text-slate-400">{t.messages?.length || 0} msgs</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Conversation */}
          {activeTicket && (
            <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col min-h-[520px] overflow-hidden">
              {/* Ticket Details Bar */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {activeTicket.ticket_number}
                    </span>
                    <StatusBadge status={activeTicket.status} />
                    <CategoryBadge category={activeTicket.category} />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(activeTicket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-900 mt-1">{activeTicket.subject}</h2>
                <div className="text-xs text-slate-500 mt-1">
                  Context: <strong className="text-slate-800">{activeTicket.book_title}</strong>
                  {activeTicket.assigned_name && (
                    <span> · Assigned: <strong>{activeTicket.assigned_name}</strong></span>
                  )}
                </div>

                {activeTicket.attachment_name && (
                  <div className="mt-2 text-xs text-slate-600 inline-flex items-center bg-white px-2 py-0.5 rounded border border-slate-200">
                    <Paperclip className="w-3 h-3 mr-1 text-slate-400" />
                    <span>Attached: {activeTicket.attachment_name}</span>
                  </div>
                )}
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[380px] bg-slate-50/30">
                {activeTicket.messages?.map((msg, index) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-slate-700">
                          {isAdmin ? `${msg.sender_name} (BookLeaf Team)` : 'You'}
                        </span>
                        <span> · </span>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`rounded-lg px-3.5 py-2.5 text-xs sm:text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed shadow-xs ${
                          isAdmin
                            ? 'bg-white text-slate-900 border border-slate-200'
                            : 'bg-[#F16877] text-white'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="p-3.5 border-t border-slate-200 bg-white">
                {error && (
                  <div className="p-2 mb-2 rounded bg-rose-50 text-rose-800 text-xs flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-[#F16877]" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F16877] text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="px-4 py-2 rounded-md bg-[#F16877] hover:bg-[#e04c5d] disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm flex items-center"
                  >
                    Send
                    <Send className="w-3 h-3 ml-1.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
