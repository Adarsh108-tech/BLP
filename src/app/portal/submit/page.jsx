'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send, Paperclip, AlertCircle, CheckCircle2, ArrowRight, X } from 'lucide-react';

function SubmitQueryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBookId = searchParams.get('book_id') || 'GENERAL';

  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(initialBookId);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultSuccess, setResultSuccess] = useState(null);

  useEffect(() => {
    async function fetchAuthorBooks() {
      try {
        const res = await fetch('/api/books');
        const data = await res.json();
        if (data.success && data.books) {
          setBooks(data.books);
        }
      } catch (e) {
        console.error('Failed to load books:', e);
      }
    }
    fetchAuthorBooks();
  }, []);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (subject.trim().length < 3) {
      setError('Please provide a descriptive subject (at least 3 characters)');
      return;
    }

    if (description.trim().length < 8) {
      setError('Please provide more details in the description (at least 8 characters)');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: selectedBook,
          subject: subject.trim(),
          description: description.trim(),
          attachment_name: attachment ? attachment.name : null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit ticket');
      }

      setResultSuccess(data.ticket);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-[#5E5E5E]">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Submit Author Support Query
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Queries are automatically prioritized and routed to operations under our 48-hour SLA.
        </p>
      </div>

      {/* Confirmation View */}
      {resultSuccess ? (
        <div className="bg-white rounded-lg border border-slate-200 p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ticket #{resultSuccess.ticket_number} Submitted
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your support request has been logged in our operations queue.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 text-left text-xs max-w-md mx-auto grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 font-medium">Category:</span>
              <div className="font-semibold text-slate-900">{resultSuccess.category}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Assigned Priority:</span>
              <div className="font-semibold text-slate-900">{resultSuccess.priority}</div>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-2.5">
            <button
              onClick={() => router.push('/portal/tickets')}
              className="px-4 py-2 rounded-md bg-[#F16877] hover:bg-[#e04c5d] text-white text-xs font-semibold shadow-sm transition inline-flex items-center"
            >
              View My Tickets <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
            <button
              onClick={() => {
                setResultSuccess(null);
                setSubject('');
                setDescription('');
                setAttachment(null);
              }}
              className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
            >
              Submit Another
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#F16877]" />
                <span>{error}</span>
              </div>
            )}

            {/* Book Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Book / Query Context
              </label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F16877]"
              >
                <option value="GENERAL">General / Account Level (Royalties, Bio, Account)</option>
                {books.map((b) => (
                  <option key={b.book_id} value={b.book_id}>
                    {b.title} ({b.book_id} · {b.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your query"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F16877]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include relevant details (dates, order numbers, platform links, or specific questions)..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F16877] leading-relaxed"
              />
            </div>

            {/* File Attachment */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Attachment (Optional)
              </label>
              {attachment ? (
                <div className="flex items-center justify-between p-2.5 rounded-md border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{attachment.name}</span>
                    <span className="text-slate-400">({attachment.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center space-x-2 p-3 border border-dashed border-slate-300 rounded-md hover:border-slate-400 cursor-pointer bg-slate-50 text-xs text-slate-600 transition">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span>Attach document or image (proofs, defect photos, invoices)</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-md font-semibold text-xs sm:text-sm text-white bg-[#F16877] hover:bg-[#e04c5d] disabled:opacity-50 transition shadow-sm flex items-center"
              >
                {submitting ? 'Submitting...' : 'Submit Query'}
                <Send className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function SubmitQueryPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-xs text-slate-500">Loading form...</div>}>
      <SubmitQueryForm />
    </Suspense>
  );
}
