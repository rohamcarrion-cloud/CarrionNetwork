import pb from '@/lib/pocketbaseClient';

export async function getUserRoles(userId) {
  const records = await pb.collection('user_roles').getFullList({
    filter: pb.filter('user_id = {:id}', { id: userId }),
    expand: 'role_id',
  });
  return records
    .map((r) => r.expand?.role_id?.name)
    .filter(Boolean);
}

export async function hasRole(userId, roleName) {
  const roles = await getUserRoles(userId);
  return roles.includes(roleName);
}

export async function hasAnyRole(userId, roleNames) {
  const roles = await getUserRoles(userId);
  return roleNames.some((r) => roles.includes(r));
}

async function findRole(roleName) {
  return pb
    .collection('roles')
    .getFirstListItem(pb.filter('name = {:n}', { n: roleName }));
}

// Assigning a role requires elevated (admin) access per the collection rules.
// This is exposed for the future admin onboarding flow.
export async function assignRole(userId, roleName, assignedBy) {
  const role = await findRole(roleName);
  return pb.collection('user_roles').create({
    user_id: userId,
    role_id: role.id,
    assigned_by: assignedBy || null,
  });
}

export async function removeRole(userId, roleName) {
  const role = await findRole(roleName);
  const rec = await pb
    .collection('user_roles')
    .getFirstListItem(
      pb.filter('user_id = {:u} && role_id = {:r}', { u: userId, r: role.id }),
    );
  return pb.collection('user_roles').delete(rec.id);
}
