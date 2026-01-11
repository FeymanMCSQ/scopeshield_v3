import { redirect } from 'next/navigation';
import { validateSession, revokeCurrentSession } from '@/lib/auth';

export default async function DashboardPage() {
  const s = await validateSession();
  if (!s) redirect('/login');

  async function logout() {
    'use server';
    await revokeCurrentSession();
    redirect('/login');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Logged in as userId: {s.userId}</p>

      <form action={logout}>
        <button type="submit">Logout</button>
      </form>
    </main>
  );
}
