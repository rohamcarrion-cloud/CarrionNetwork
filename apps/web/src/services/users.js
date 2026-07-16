import pb from '@/lib/pocketbaseClient';

export function getUser(userId) {
  return pb.collection('users').getOne(userId);
}

export async function getProfile(userId) {
  try {
    return await pb
      .collection('profiles')
      .getFirstListItem(pb.filter('user_id = {:id}', { id: userId }));
  } catch (err) {
    if (err?.status === 404) return null;
    throw err;
  }
}

export async function updateProfile(userId, data) {
  const existing = await getProfile(userId);
  if (existing) {
    return pb.collection('profiles').update(existing.id, data);
  }
  return pb.collection('profiles').create({ user_id: userId, ...data });
}

export async function uploadAvatar(userId, file) {
  const existing = await getProfile(userId);
  const fd = new FormData();
  fd.append('avatar_url', file);
  if (existing) {
    return pb.collection('profiles').update(existing.id, fd);
  }
  fd.append('user_id', userId);
  return pb.collection('profiles').create(fd);
}

export function avatarUrl(profile) {
  if (profile?.avatar_url) {
    return pb.files.getURL(profile, profile.avatar_url);
  }
  return null;
}
