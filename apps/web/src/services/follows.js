import pb from '@/lib/pocketbaseClient';

export function followPodcast(userId, podcastId) {
  return pb.collection('follows').create({ user_id: userId, podcast_id: podcastId });
}

export async function unfollowPodcast(userId, podcastId) {
  const rec = await pb
    .collection('follows')
    .getFirstListItem(pb.filter('user_id = {:u} && podcast_id = {:p}', { u: userId, p: podcastId }));
  return pb.collection('follows').delete(rec.id);
}

export async function isFollowing(userId, podcastId) {
  try {
    await pb
      .collection('follows')
      .getFirstListItem(pb.filter('user_id = {:u} && podcast_id = {:p}', { u: userId, p: podcastId }));
    return true;
  } catch (err) {
    if (err?.status === 404) return false;
    throw err;
  }
}

export function getUserFollows(userId) {
  return pb.collection('follows').getFullList({
    filter: pb.filter('user_id = {:id}', { id: userId }),
    expand: 'podcast_id',
    sort: '-created',
  });
}
