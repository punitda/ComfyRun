import { getAuth, User } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { createClerkClient } from "@clerk/remix/api.server";
import { SignInError } from "~/lib/types";

const EMAIL_WHITELIST = process.env.EMAIL_WHITELIST?.split(",") || [];
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function requireAuth(
  args: LoaderFunctionArgs
): Promise<{ user: User } | { error: SignInError }> {
  const { userId, sessionId } = await getAuth(args);
  console.log("userId", userId);
  console.log("sessionId", sessionId);

  if (!userId) {
    return { error: "LOGGED_OUT" };
  }

  const user = await clerk.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;
  console.log("userEmail", userEmail);

  if (!userEmail || !EMAIL_WHITELIST.includes(userEmail)) {
    await clerk.sessions.revokeSession(sessionId);
    return { error: "EMAIL_NOT_ALLOWED" };
  }

  return { user };
}
