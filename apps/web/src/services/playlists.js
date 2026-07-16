import pb from '@/lib/pocketbaseClient';

export function getUserPlaylists(userId) {
  return pb.collection('playlists').getFullList({
    filter: pb.filter('user_id = {:id}', { id: userId }),
    sort: '-created',
  });
}

export function createPlaylist(userId, data) {
  return pb.collection('playlists').create({ user_id: userId, is_public: false, ...data });
}

export function updatePlaylist(playlistId, data) {
  return pb.collection('playlists').update(playlistId, data);
}

export function deletePlaylist(playlistId) {
  return pb.collection('playlists').delete(playlistId);
}

export async function addToPlaylist(playlistId, episodeId) {
  const items = await pb.collection('playlist_items').getFullList({
    filter: pb.filter('playlist_id = {:id}', { id: playlistId }),
  });
  return pb.collection('playlist_items').create({
    playlist_id: playlistId,
    episode_id: episodeId,
    position: items.length,
  });
}

export async function removeFromPlaylist(playlistId, episodeId) {
  const rec = await pb
    .collection('playlist_items')
    .getFirstListItem(
      pb.filter('playlist_id = {:p} && episode_id = {:e}', { p: playlistId, e: episodeId }),
    );
  return pb.collection('playlist_items').delete(rec.id);
}

export function getPlaylistItems(playlistId) {
  return pb.collection('playlist_items').getFullList({
    filter: pb.filter('playlist_id = {:id}', { id: playlistId }),
    sort: 'position',
    expand: 'episode_id',
  });
}
