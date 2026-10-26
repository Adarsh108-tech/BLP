'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadAuthors() {
      try {
        const res = await fetch('/api/authors');
        const data = await res.json();
        if (data.success) {
          setAuthors(data.authors || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAuthors();
  }, []);

  const filteredAuthors = authors.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.author_id.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 text-[#5E5E5E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Author Accounts &amp; Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of all 10 registered authors, published titles, and pending disbursements.
          </p>
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search author..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F16877] text-slate-900"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">Loading authors...</div>
      ) : (
        <div className="space-y-3">
          {filteredAuthors.map((author) => {
            const stats = author.stats || {};
            const isRollover = stats.totalRoyaltyPending > 0 && stats.totalRoyaltyPending < 1000;

            return (
              <div
                key={author.author_id}
                className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition space-y-3 text-xs"
              >
                {/* Author Info Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{author.name}</span>
                      <span className="font-mono text-xs font-semibold text-slate-500">[{author.author_id}]</span>
                      <span className="text-slate-400">· {author.city}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {author.email} · {author.phone} · Joined {author.joined_date}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700">
                      <span className="text-slate-400 mr-1 uppercase text-[10px] font-bold">Titles:</span>
                      <strong>{stats.booksCount || 0}</strong>
                    </div>

                    <div className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700">
                      <span className="text-slate-400 mr-1 uppercase text-[10px] font-bold">Sold:</span>
                      <strong>{(stats.totalCopiesSold || 0).toLocaleString()}</strong>
                    </div>

                    <div className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                      <span className="text-emerald-600 mr-1 uppercase text-[10px] font-bold">Disbursed:</span>
                      <strong>₹{(stats.totalRoyaltyPaid || 0).toLocaleString()}</strong>
                    </div>

                    <div className={`px-2.5 py-1 rounded border ${
                      isRollover ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}>
                      <span className="text-slate-400 mr-1 uppercase text-[10px] font-bold">Pending:</span>
                      <strong className={isRollover ? 'text-amber-800' : 'text-[#F16877]'}>
                        ₹{(stats.totalRoyaltyPending || 0).toLocaleString()}
                      </strong>
                      {isRollover && <span className="text-[10px] text-amber-700 ml-1 font-semibold">(Rolls over)</span>}
                    </div>

                    <Link
                      href={`/admin?author_id=${author.author_id}`}
                      className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
                    >
                      Tickets ({stats.ticketCount || 0})
                    </Link>
                  </div>
                </div>

                {/* Books Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(author.books || []).map((bk) => {
                    const isProd = bk.status.includes('Production');
                    return (
                      <div
                        key={bk.book_id}
                        className="p-2.5 rounded bg-slate-50/70 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 truncate max-w-[170px]">{bk.title}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            isProd ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {bk.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex justify-between">
                          <span>ISBN: <strong className="font-mono text-slate-700">{bk.isbn || 'Pending'}</strong></span>
                          <span>MRP: {bk.mrp ? `₹${bk.mrp}` : 'TBD'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-200">
                          <span>Sold: <strong>{bk.total_copies_sold}</strong></span>
                          <span>Earned: <strong>₹{bk.total_royalty_earned}</strong></span>
                          <span>Pending: <strong className="text-[#F16877]">₹{bk.royalty_pending}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
