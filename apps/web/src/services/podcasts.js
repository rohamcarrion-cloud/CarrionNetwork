import pb from '@/lib/pocketbaseClient';

export function getPodcast(podcastId) {
  return pb.collection('podcasts').getOne(podcastId, { expand: 'category_id,creator_id' });
}

export function getPodcasts(filters = {}) {
  const parts = [];
  const params = {};
  if (filters.status) {
    parts.push('status = {:status}');
    params.status = filters.status;
  }
  if (filters.categoryId) {
    parts.push('category_id = {:cat}');
    params.cat = filters.categoryId;
  }
  return pb.collection('podcasts').getList(filters.page || 1, filters.perPage || 30, {
    filter: parts.length ? pb.filter(parts.join(' && '), params) : '',
    sort: filters.sort || '-created',
    expand: 'category_id',
  });
}

export function createPodcast(creatorId, data) {
  return pb.collection('podcasts').create({ creator_id: creatorId, status: 'draft', ...data });
}

export function updatePodcast(podcastId, data) {
  return pb.collection('podcasts').update(podcastId, data);
}

export function uploadArtwork(podcastId, file) {
  const fd = new FormData();
  fd.append('artwork_url', file);
  return pb.collection('podcasts').update(podcastId, fd);
}

export function getPodcastTeam(podcastId) {
  return pb.collection('podcast_team_members').getFullList({
    filter: pb.filter('podcast_id = {:id}', { id: podcastId }),
    expand: 'user_id',
  });
}
