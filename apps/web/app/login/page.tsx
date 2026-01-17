import { redirect } from 'next/navigation';
import { userRepo } from '@scopeshield/db';

import { createSession } from '@/lib/auth';

export default function LoginPage() {
  async function devLogin() {
    'use server';

    const email = 'dev@scopeshield.local';

    const user = await userRepo.upsertDevUser(email, 'Dev User');


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
