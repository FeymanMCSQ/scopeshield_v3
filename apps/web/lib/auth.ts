import { auth, currentUser } from "@clerk/nextjs/server";
import { userRepo } from '@scopeshield/db';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in'); // Redirect to Clerk login
  }

  // Check if user exists in our DB
  let dbUser = await userRepo.findUserById(userId);

  if (!dbUser) {
    // Lazy Sync: Create user if missing
    // We need more details from Clerk to create the user properly (like email)
    const clerkUser = await currentUser();

    if (!clerkUser) {
      // Should theoretically not happen if auth() returned a userId
      redirect('/sign-in');
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? 'no-email@clerk.user';
    const name = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();

    // We can't use 'createUserWithPassword' or 'upsertDevUser' exactly as is because
    // we want to force the ID to match Clerk's ID.
    // So we'll need to extend userRepo slightly or use prisma directly here if repo allows.
    // For now, let's assume we update userRepo to support creating with explicit ID.
    // OR we use upsert with the ID. 

    // Let's modify userRepo to allow creating with a specific ID, 
    // or just use a new method 'syncClerkUser'.

    // For this step, I'll assume we'll add 'syncClerkUser' to userRepo next or just use a workaround.
    // I will use a direct prisma call in a separate file or just wait to update userRepo.
    // Actually, let's return null here and handle the sync in the repo update step easier.

    // But to keep this file compiling, let's assume `syncClerkUser` exists.
    dbUser = await userRepo.syncClerkUser(userId, email, name);
  }

  return dbUser;
}


