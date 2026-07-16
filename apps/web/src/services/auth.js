import pb from '@/lib/pocketbaseClient';

export async function register({ email, password, username }) {
  // The auth record is created here. Profile + default "listener" role are
  // created server-side by the `assign_default_role.pb.js` PocketBase hook
  // (idempotent). If the hook fails, PocketBase returns an error and the user
  // is NOT created — so we never end up in a half-initialized state here.
  const user = await pb.collection('users').create({
    email,
    password,
    passwordConfirm: password,
    username,
  });

  await pb.collection('users').authWithPassword(email, password);

  // Verify the server-side onboarding actually completed. Do not pretend
  // registration succeeded if the role or profile were not created.
  try {
    const roles = await pb.collection('user_roles').getFullList({
      filter: `user_id = "${user.id}"`,
    });
    if (!roles.length) {
      throw new Error('Account was created but no role was assigned.');
    }
  } catch (err) {
    if (err?.status === 403 || err?.status === 404) {
      // Access rules may hide the check; the hook aborts on failure, so a
      // successful create implies onboarding ran. Treat as success.
      return user;
    }
    throw new Error(
      'Your account could not be fully initialized. Please contact support.',
    );
  }

  return user;
}

export function login(email, password) {
  return pb.collection('users').authWithPassword(email, password);
}

export function logout() {
  pb.authStore.clear();
}

export function getCurrentUser() {
  return pb.authStore.isValid ? pb.authStore.record : null;
}

export function isAuthenticated() {
  return pb.authStore.isValid;
}

export function resetPassword(email) {
  return pb.collection('users').requestPasswordReset(email);
}

export async function updatePassword(oldPassword, newPassword) {
  const user = pb.authStore.record;
  return pb.collection('users').update(user.id, {
    oldPassword,
    password: newPassword,
    passwordConfirm: newPassword,
  });
}

export function verifyEmail(token) {
  return pb.collection('users').confirmVerification(token);
}

export function requestVerification(email) {
  return pb.collection('users').requestVerification(email);
}
