'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export default function HomePortal() {
  const router = useRouter();
  const [roleTab, setRoleTab] = useState('author'); // 'author' | 'admin'
  const [email, setEmail] = useState('priya.sharma@email.com');
  const [password, setPassword] = useState('bookleaf123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleTabChange(tab) {
    setRoleTab(tab);
    setError('');
    if (tab === 'admin') {
      setEmail('admin@bookleaf.pub');
      setPassword('admin123');
    } else {
      setEmail('priya.sharma@email.com');
      setPassword('bookleaf123');
    }
  }

  function handleSelectProfile(testEmail, testPass, role) {
    setRoleTab(role);
    setEmail(testEmail);
    setPassword(testPass);
    setError('');
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }

      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/portal/books');
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isAuthor = roleTab === 'author';

  return (
    <div className="h-screen max-h-screen w-full flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden text-[#5E5E5E]">
      {/* 1. Clean Top Header */}
      <div className="max-w-md mx-auto w-full text-center shrink-0">
        <div className="inline-flex items-center space-x-2.5 mb-2">
          <div className="w-9 h-9 rounded-lg bg-[#F16877] text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
            B
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            BookLeaf Publishing
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Author Support &amp; Operations Portal
        </h1>
        <p className="text-xs text-[#5E5E5E] mt-1">
          Sign in to access your author catalog, royalty reports, or support queue.
        </p>
      </div>

      {/* 2. Focused Login Console Card */}
      <div className="max-w-md mx-auto w-full my-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-7">
          {/* Segmented Control / Form Toggler */}
          <div className="grid grid-cols-2 p-1 rounded-lg bg-slate-100 border border-slate-200 mb-5">
            <button
              type="button"
              onClick={() => handleTabChange('author')}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                isAuthor
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#F16877]" />
              <span>Author Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`py-2 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                !isAuthor
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#F16877]" />
              <span>Operations Admin</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#F16877]" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {isAuthor ? 'Author Email' : 'Admin Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F16877] focus:border-[#F16877] bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F16877] focus:border-[#F16877] bg-white text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md font-semibold text-xs sm:text-sm text-white bg-[#F16877] hover:bg-[#e04c5d] active:scale-[0.99] transition shadow-sm flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center">
                  {isAuthor ? 'Sign In as Author' : 'Sign In as Admin'}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Quick Test Personas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {isAuthor ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectProfile('priya.sharma@email.com', 'bookleaf123', 'author')}
                    className={`text-xs px-2.5 py-1 rounded border transition ${
                      email === 'priya.sharma@email.com'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Priya (₹3,570 Pending)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectProfile('sneha.kulkarni@email.com', 'bookleaf123', 'author')}
                    className={`text-xs px-2.5 py-1 rounded border transition ${
                      email === 'sneha.kulkarni@email.com'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Sneha (In Production)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectProfile('kavita.deshmukh@email.com', 'bookleaf123', 'author')}
                    className={`text-xs px-2.5 py-1 rounded border transition ${
                      email === 'kavita.deshmukh@email.com'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Kavita (&lt;₹1,000 Rollover)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectProfile('admin@bookleaf.pub', 'admin123', 'admin')}
                    className={`text-xs px-2.5 py-1 rounded border transition ${
                      email === 'admin@bookleaf.pub'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Aditi Verma (Support Lead)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectProfile('ops@bookleaf.pub', 'admin123', 'admin')}
                    className={`text-xs px-2.5 py-1 rounded border transition ${
                      email === 'ops@bookleaf.pub'
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rohan Mehta (Ops Manager)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Operational Specs Bar */}
      <div className="max-w-2xl mx-auto w-full shrink-0 flex items-center justify-center space-x-6 text-[11px] font-medium text-slate-500">
        <span>80/20 Net Profit Royalty</span>
        <span>•</span>
        <span>₹1,000 Minimum Payout</span>
        <span>•</span>
        <span>Quarterly Payouts</span>
        <span>•</span>
        <span>48h SLA</span>
      </div>
    </div>
  );
}
