/// <reference path="../pb_data/types.d.ts" />

// On every new user creation, initialize onboarding server-side:
//   1. Assign the default "listener" role (user_roles record).
//   2. Create a starter profile record.
// Both steps are idempotent — safe to run again without creating duplicates.
// Failures are logged clearly; a failed role assignment aborts the user
// creation so an account is never left in a roleless / broken state.
onRecordAfterCreateSuccess((e) => {
  const userId = e.record.id;

  // --- 1. Default "listener" role (idempotent) ---
  let role;
  try {
    role = $app.findFirstRecordByData("roles", "name", "listener");
  } catch (err) {
    $app.logger().error(
      "onboarding: 'listener' role not found — cannot initialize user",
      "user", userId,
      "error", String(err),
    );
    // Do not pretend onboarding succeeded. Abort so the frontend surfaces it.
    throw new BadRequestError("Account could not be fully initialized: default role missing.");
  }

  try {
    // Idempotency: only create the link if it does not already exist.
    let existing = null;
    try {
      existing = $app.findFirstRecordByFilter(
        "user_roles",
        "user_id = {:uid} && role_id = {:rid}",
        { uid: userId, rid: role.id },
      );
    } catch (_) {
      existing = null;
    }
    if (!existing) {
      const userRoles = $app.findCollectionByNameOrId("user_roles");
      const rec = new Record(userRoles);
      rec.set("user_id", userId);
      rec.set("role_id", role.id);
      $app.save(rec);
    }
  } catch (err) {
    $app.logger().error(
      "onboarding: failed to assign default listener role",
      "user", userId,
      "error", String(err),
    );
    throw new BadRequestError("Account could not be fully initialized: role assignment failed.");
  }

  // --- 2. Starter profile (idempotent) ---
  try {
    let profile = null;
    try {
      profile = $app.findFirstRecordByFilter(
        "profiles",
        "user_id = {:uid}",
        { uid: userId },
      );
    } catch (_) {
      profile = null;
    }
    if (!profile) {
      const profiles = $app.findCollectionByNameOrId("profiles");
      const rec = new Record(profiles);
      rec.set("user_id", userId);
      rec.set("display_name", e.record.getString("username") || e.record.getString("name") || "");
      $app.save(rec);
    }
  } catch (err) {
    $app.logger().error(
      "onboarding: failed to create starter profile",
      "user", userId,
      "error", String(err),
    );
    throw new BadRequestError("Account could not be fully initialized: profile creation failed.");
  }

  e.next();
}, "users");
