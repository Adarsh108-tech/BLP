import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Author from '@/models/Author';
import { BookOpen, DollarSign, ShoppingBag, Clock, AlertTriangle, CheckCircle2, MessageSquarePlus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MyBooksPage() {
  const session = await getSessionUser();
  await connectToDatabase();

  const author = await Author.findOne({ author_id: session?.author_id }).lean();
  const books = author?.books || [];

  const totalEarnings = books.reduce((sum, b) => sum + (b.total_royalty_earned || 0), 0);
  const totalPaid = books.reduce((sum, b) => sum + (b.royalty_paid || 0), 0);
  const totalPending = books.reduce((sum, b) => sum + (b.royalty_pending || 0), 0);
  const totalCopies = books.reduce((sum, b) => sum + (b.total_copies_sold || 0), 0);
  const isRollover = totalPending > 0 && totalPending < 1000;

  return (
    <div className="space-y-6 text-[#5E5E5E]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Books &amp; Royalty Statement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Author ID: <span className="font-mono font-semibold text-slate-800">{author?.author_id}</span> · {author?.name} · {author?.email}
          </p>
        </div>

        <Link
          href="/portal/submit"
          className="inline-flex items-center px-3.5 py-2 rounded-md bg-[#F16877] hover:bg-[#e04c5d] text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />
          Submit Support Query
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Catalog */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Catalog Titles</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{books.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {books.filter((b) => b.status === 'Published & Live').length} Live · {books.filter((b) => b.status.includes('Production')).length} In Production
          </div>
        </div>

        {/* Copies Sold */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Units Sold</span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCopies.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Amazon, Flipkart &amp; Store
          </div>
        </div>

        {/* Royalty Earned */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Royalties</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{totalEarnings.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            ₹{totalPaid.toLocaleString()} disbursed to date
          </div>
        </div>

        {/* Royalty Pending */}
        <div className={`rounded-lg border p-4 shadow-sm ${
          isRollover ? 'bg-amber-50/50 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Payout</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{totalPending.toLocaleString()}</div>
          {isRollover ? (
            <div className="text-[11px] text-amber-800 font-semibold mt-1">
              Below ₹1,000 threshold (Rolls over)
            </div>
          ) : totalPending >= 1000 ? (
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              Eligible for next quarterly transfer
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 mt-1">All royalties settled</div>
          )}
        </div>
      </div>

      {/* Threshold Rollover Policy Alert */}
      {isRollover && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">BookLeaf Minimum Payout Policy:</span> Your pending balance of ₹{totalPending} is currently below the ₹1,000 minimum threshold. Earnings remain securely credited and will automatically disburse on the next quarterly schedule once the total reaches ₹1,000.
          </div>
        </div>
      )}

      {/* Book Catalog Table / List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          Published Titles &amp; Manuscripts
        </h2>

        <div className="space-y-3">
          {books.map((book) => {
            const isProduction = book.status.includes('Production');

            return (
              <div
                key={book.book_id}
                className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition"
              >
                {/* Book Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-baseline space-x-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">{book.title}</h3>
                    <span className="font-mono text-xs text-slate-500">[{book.book_id}]</span>
                    <span className="text-xs text-slate-500">· {book.genre}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      isProduction
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}>
                      {book.status}
                    </span>

                    <Link
                      href={`/portal/submit?book_id=${book.book_id}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                    >
                      Raise Query
                    </Link>
                  </div>
                </div>

                {/* Production Notice or Financial Grid */}
                {isProduction ? (
                  <div className="py-4 px-3 my-3 bg-slate-50 rounded border border-dashed border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800">Production Stage: {book.status}</span>
                    <p className="text-slate-500 mt-0.5">
                      Typesetting &amp; cover proofing in progress. Pricing and multi-channel distribution activate upon proof sign-off.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 py-3 border-b border-slate-100 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Retail MRP</div>
                      <div className="font-bold text-slate-900 mt-0.5">₹{book.mrp}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Royalty / Unit</div>
                      <div className="font-bold text-slate-900 mt-0.5">₹{book.author_royalty_per_copy}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Units Sold</div>
                      <div className="font-bold text-slate-900 mt-0.5">{book.total_copies_sold?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Total Royalty</div>
                      <div className="font-bold text-slate-900 mt-0.5">₹{book.total_royalty_earned?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Disbursed</div>
                      <div className="font-bold text-emerald-700 mt-0.5">₹{book.royalty_paid?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">Pending</div>
                      <div className="font-bold text-[#F16877] mt-0.5">₹{book.royalty_pending?.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="pt-2.5 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span>ISBN: <strong className="font-mono text-slate-700">{book.isbn || 'Pending'}</strong></span>
                    <span>·</span>
                    <span>Published: <strong className="text-slate-700">{book.publication_date || 'In Production'}</strong></span>
                    <span>·</span>
                    <span>Channels: {book.available_on?.length ? book.available_on.join(', ') : 'Pending'}</span>
                  </div>

                  <div>
                    Last Payout: <strong className="text-slate-700">{book.last_royalty_payout_date || 'None'}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
