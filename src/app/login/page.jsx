'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Shield, AlertCircle, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'author';

  const [activeTab, setActiveTab] = useState(defaultRole === 'admin' ? 'admin' : 'author');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'admin') {
      setEmail('admin@bookleaf.pub');
      setPassword('admin123');
    } else {
      setEmail('priya.sharma@email.com');
      setPassword('bookleaf123');
    }
  }, [activeTab]);

  async function handleSubmit(e) {
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

  function fillAccount(testEmail, testPass, role) {
    setActiveTab(role);
    setEmail(testEmail);
    setPassword(testPass);
    setError('');
  }

  const isAuthor = activeTab === 'author';

  return (
    <div className="max-w-md w-full space-y-5 text-[#5E5E5E]">
      {/* Brand Header */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg bg-[#F16877] text-white flex items-center justify-center font-extrabold text-xl shadow-sm">
            B
          </div>
        </Link>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Sign In to BookLeaf Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your email and password to access your account.
        </p>
      </div>

      {/* Role Toggle Tabs */}
      <div className="grid grid-cols-2 p-1 rounded-lg bg-slate-200/70 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('author')}
          className={`py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
            isAuthor
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#F16877]" />
          <span>Author Portal</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
            !isAuthor
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-[#F16877]" />
          <span>Operations Admin</span>
        </button>
      </div>

      {/* Card */}
      <div className="bg-white py-6 px-6 sm:px-7 shadow-sm rounded-xl border border-slate-200">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#F16877] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F16877] text-slate-900"
              placeholder="name@email.com"
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
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F16877] text-slate-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md font-semibold text-xs sm:text-sm text-white bg-[#F16877] hover:bg-[#e04c5d] active:scale-[0.99] transition shadow-sm flex items-center justify-center"
          >
            {loading ? 'Authenticating...' : (
              <span className="flex items-center">
                Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </span>
            )}
          </button>
        </form>

        {/* Quick Click Demo Credentials */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quick Test Accounts:
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillAccount('admin@bookleaf.pub', 'admin123', 'admin')}
              className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
            >
              <div className="font-semibold text-slate-900">Admin Lead</div>
              <div className="text-[10px] text-slate-500">Aditi Verma</div>
            </button>

            <button
              type="button"
              onClick={() => fillAccount('priya.sharma@email.com', 'bookleaf123', 'author')}
              className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
            >
              <div className="font-semibold text-slate-900">Author (Live)</div>
              <div className="text-[10px] text-slate-500">Priya Sharma</div>
            </button>

            <button
              type="button"
              onClick={() => fillAccount('sneha.kulkarni@email.com', 'bookleaf123', 'author')}
              className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
            >
              <div className="font-semibold text-slate-900">Author (Production)</div>
              <div className="text-[10px] text-slate-500">Sneha Kulkarni</div>
            </button>

            <button
              type="button"
              onClick={() => fillAccount('kavita.deshmukh@email.com', 'bookleaf123', 'author')}
              className="text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 transition"
            >
              <div className="font-semibold text-slate-900">Author (Rollover)</div>
              <div className="text-[10px] text-slate-500">Kavita Deshmukh</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <Suspense fallback={<div className="text-center text-xs text-slate-500">Loading portal login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
