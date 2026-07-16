import pb from '@/lib/pocketbaseClient';

export function getEpisode(episodeId) {
  return pb.collection('episodes').getOne(episodeId, { expand: 'podcast_id' });
}

export function getEpisodes(podcastId) {
  return pb.collection('episodes').getFullList({
    filter: pb.filter('podcast_id = {:id}', { id: podcastId }),
    sort: '-created',
  });
}

export function createEpisode(podcastId, data) {
  return pb.collection('episodes').create({ podcast_id: podcastId, status: 'draft', ...data });
}

export function updateEpisode(episodeId, data) {
  return pb.collection('episodes').update(episodeId, data);
}

export function uploadArtwork(episodeId, file) {
  const fd = new FormData();
  fd.append('artwork_url', file);
  return pb.collection('episodes').update(episodeId, fd);
}
