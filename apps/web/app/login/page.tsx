import { redirect } from 'next/navigation';
import { prisma } from '@scopeshield/db';
import { createSession } from '@/lib/auth';

export default function LoginPage() {
  async function devLogin() {
    'use server';

    const email = 'dev@scopeshield.local';

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: 'Dev User' },
      select: { id: true },
    });

    await createSession(user.id); // <-- sets HTTP-only cookie on the real browser response
    redirect('/dashboard');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Login</h1>
      <p>Dev-only stub login. Sets an HTTP-only session cookie.</p>

      <form action={devLogin}>
        <button type="submit">Dev Login</button>
      </form>
    </main>
  );
}
