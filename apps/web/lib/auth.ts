import { auth, currentUser } from "@clerk/nextjs/server";
import { userRepo } from '@scopeshield/db';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const start = Date.now();
  console.log('[Auth] getCurrentUser started');

  const { userId, debug } = await auth();
  const tAuth = Date.now();
  console.log(`[Auth] Clerk auth() took ${tAuth - start}ms. UserId: ${userId}`);

  if (!userId) {
    return null;
  }

  // Check if user exists in our DB
  let dbUser = await userRepo.findUserById(userId);
  const tFind = Date.now();
  console.log(`[Auth] userRepo.findUserById took ${tFind - tAuth}ms`);

  if (!dbUser) {
    console.log('[Auth] User not in DB, starting sync...');
    const tSyncStart = Date.now();

    // Lazy Sync: Create user if missing
    // We need more details from Clerk to create the user properly (like email)
    const clerkUser = await currentUser();
    const tCurrentUser = Date.now();
    console.log(`[Auth] Clerk currentUser() took ${tCurrentUser - tSyncStart}ms`);

    if (!clerkUser) {
      return null; // Should not happen
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? 'no-email@clerk.user';
    const name = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();

    dbUser = await userRepo.syncClerkUser(userId, email, name);
    const tSyncEnd = Date.now();
    console.log(`[Auth] userRepo.syncClerkUser took ${tSyncEnd - tCurrentUser}ms`);
  }

  console.log(`[Auth] getCurrentUser total took ${Date.now() - start}ms`);
  return dbUser;
}


