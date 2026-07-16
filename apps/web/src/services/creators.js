import pb from '@/lib/pocketbaseClient';

export async function getCreatorProfile(userId) {
  try {
    return await pb
      .collection('creator_profiles')
      .getFirstListItem(pb.filter('user_id = {:id}', { id: userId }));
  } catch (err) {
    if (err?.status === 404) return null;
    throw err;
  }
}

export function createCreatorProfile(userId, data = {}) {
  return pb.collection('creator_profiles').create({
    user_id: userId,
    podcast_count: 0,
    verified: false,
    ...data,
  });
}

export async function updateCreatorProfile(userId, data) {
  const existing = await getCreatorProfile(userId);
  if (!existing) return createCreatorProfile(userId, data);
  return pb.collection('creator_profiles').update(existing.id, data);
}

export function getCreatorPodcasts(userId) {
  return pb.collection('podcasts').getFullList({
    filter: pb.filter('creator_id = {:id}', { id: userId }),
    sort: '-created',
    expand: 'category_id',
  });
}
