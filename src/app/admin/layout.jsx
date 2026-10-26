import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const session = await getSessionUser();

  if (!session || session.role !== 'admin') {
    redirect('/login?role=admin');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentUser={session} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
