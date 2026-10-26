'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Shield, LogOut, ChevronDown, Check, User } from 'lucide-react';

export default function Navbar({ currentUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const isAdminSection = pathname.startsWith('/admin');

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function handleQuickSwitch(email, role) {
    setSwitching(true);
    try {
      const password = role === 'admin' ? 'admin123' : 'bookleaf123';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setQuickLoginOpen(false);
        if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/portal/books');
        }
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo & Portal Status */}
          <div className="flex items-center space-x-5">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F16877] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                B
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-base">
                  BookLeaf
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {isAdminSection ? 'Operations' : 'Portal'}
                </span>
              </div>
            </Link>

            {/* Portal Role Badge */}
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {isAdminSection ? (
                <>
                  <Shield className="w-3 h-3 mr-1 text-[#F16877]" />
                  Admin Console
                </>
              ) : (
                <>
                  <BookOpen className="w-3 h-3 mr-1 text-[#F16877]" />
                  Author View
                </>
              )}
            </span>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {isAdminSection ? (
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname === '/admin'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Ticket Queue
                </Link>
                <Link
                  href="/admin/authors"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname.startsWith('/admin/authors')
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Authors &amp; Catalog
                </Link>
                <Link
                  href="/api/docs"
                  target="_blank"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  REST API Docs
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/portal/books"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname === '/portal/books'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  My Books &amp; Royalties
                </Link>
                <Link
                  href="/portal/submit"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname === '/portal/submit'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Submit Query
                </Link>
                <Link
                  href="/portal/tickets"
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    pathname === '/portal/tickets'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  My Tickets
                </Link>
              </>
            )}
          </nav>

          {/* Right Tools: Switcher & User Account */}
          <div className="flex items-center space-x-3">
            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickLoginOpen(!quickLoginOpen)}
                disabled={switching}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
              >
                <span>Switch User</span>
                <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-500" />
              </button>

              {quickLoginOpen && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-lg bg-white shadow-lg border border-slate-200 z-50 py-1 divide-y divide-slate-100 animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Switch Account
                  </div>
                  <div className="py-1 text-xs">
                    <button
                      onClick={() => handleQuickSwitch('admin@bookleaf.pub', 'admin')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Aditi Verma</div>
                        <div className="text-[11px] text-slate-500">Operations Admin</div>
                      </div>
                      {isAdminSection && <Check className="w-3.5 h-3.5 text-[#F16877]" />}
                    </button>
                    <button
                      onClick={() => handleQuickSwitch('priya.sharma@email.com', 'author')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Priya Sharma</div>
                        <div className="text-[11px] text-slate-500">Author (2 Published Books)</div>
                      </div>
                      {currentUser?.author_id === 'AUTH001' && <Check className="w-3.5 h-3.5 text-[#F16877]" />}
                    </button>
                    <button
                      onClick={() => handleQuickSwitch('sneha.kulkarni@email.com', 'author')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Sneha Kulkarni</div>
                        <div className="text-[11px] text-slate-500">Author (In Production)</div>
                      </div>
                      {currentUser?.author_id === 'AUTH007' && <Check className="w-3.5 h-3.5 text-[#F16877]" />}
                    </button>
                    <button
                      onClick={() => handleQuickSwitch('kavita.deshmukh@email.com', 'author')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Kavita Deshmukh</div>
                        <div className="text-[11px] text-slate-500">Author (Rollover &lt; ₹1,000)</div>
                      </div>
                      {currentUser?.author_id === 'AUTH009' && <Check className="w-3.5 h-3.5 text-[#F16877]" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Chip & Logout */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="text-right text-xs hidden lg:block">
                  <div className="font-semibold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 capitalize">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
