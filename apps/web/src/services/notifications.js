import pb from '@/lib/pocketbaseClient';

export function getNotifications(userId) {
  return pb.collection('notifications').getFullList({
    filter: pb.filter('user_id = {:id}', { id: userId }),
    sort: '-created',
  });
}

export async function getUnreadCount(userId) {
  const res = await pb.collection('notifications').getList(1, 1, {
    filter: pb.filter('user_id = {:id} && read = false', { id: userId }),
  });
  return res.totalItems;
}

export function markAsRead(notificationId) {
  return pb.collection('notifications').update(notificationId, { read: true });
}

export function deleteNotification(notificationId) {
  return pb.collection('notifications').delete(notificationId);
}
