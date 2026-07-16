/// <reference path="../pb_data/types.d.ts" />

// Phase 1 verification pass: replace the permissive foundation rules with
// proper ownership / role / team-membership checks.
migrate(
  (app) => {
    const auth = "@request.auth.id != ''";
    const isCreator =
      "@collection.user_roles.user_id ?= @request.auth.id && @collection.user_roles.role_id.name ?= 'creator'";
    const isAdmin =
      "@collection.user_roles.user_id ?= @request.auth.id && @collection.user_roles.role_id.name ?= 'admin'";

    const set = (name, rules) => {
      const c = app.findCollectionByNameOrId(name);
      Object.assign(c, rules);
      app.save(c);
    };

    // team membership for a given podcast field (id of the podcast)
    const teamMember = (podcastField) =>
      `(@collection.podcast_team_members.podcast_id ?= ${podcastField} && @collection.podcast_team_members.user_id ?= @request.auth.id)`;

    // --- podcasts ---
    set("podcasts", {
      listRule: `status = "published" || (${auth} && creator_id = @request.auth.id) || (${auth} && ${teamMember("id")})`,
      viewRule: `status = "published" || (${auth} && creator_id = @request.auth.id) || (${auth} && ${teamMember("id")})`,
      createRule: `${auth} && creator_id = @request.auth.id && ${isCreator}`,
      updateRule: `${auth} && (creator_id = @request.auth.id || ${teamMember("id")})`,
      deleteRule: `${auth} && creator_id = @request.auth.id`,
    });

    // --- episodes ---
    set("episodes", {
      listRule: `status = "published" || (${auth} && podcast_id.creator_id = @request.auth.id) || (${auth} && ${teamMember("podcast_id")})`,
      viewRule: `status = "published" || (${auth} && podcast_id.creator_id = @request.auth.id) || (${auth} && ${teamMember("podcast_id")})`,
      createRule: `${auth} && (podcast_id.creator_id = @request.auth.id || ${teamMember("podcast_id")})`,
      updateRule: `${auth} && (podcast_id.creator_id = @request.auth.id || ${teamMember("podcast_id")})`,
      deleteRule: `${auth} && podcast_id.creator_id = @request.auth.id`,
    });

    // --- podcast_team_members ---
    set("podcast_team_members", {
      listRule: `${auth} && (podcast_id.creator_id = @request.auth.id || user_id = @request.auth.id)`,
      viewRule: `${auth} && (podcast_id.creator_id = @request.auth.id || user_id = @request.auth.id)`,
      createRule: `${auth} && podcast_id.creator_id = @request.auth.id`,
      updateRule: `${auth} && podcast_id.creator_id = @request.auth.id`,
      deleteRule: `${auth} && podcast_id.creator_id = @request.auth.id`,
    });

    // --- creator_profiles ---
    set("creator_profiles", {
      listRule: "",
      viewRule: "",
      createRule: `${auth} && user_id = @request.auth.id && ${isCreator}`,
      updateRule: `${auth} && user_id = @request.auth.id`,
      deleteRule: `${auth} && user_id = @request.auth.id`,
    });

    // --- user_roles ---
    set("user_roles", {
      listRule: `${auth} && (user_id = @request.auth.id || (${isAdmin}))`,
      viewRule: `${auth} && (user_id = @request.auth.id || (${isAdmin}))`,
      createRule: `${auth} && (${isAdmin})`,
      updateRule: `${auth} && (${isAdmin})`,
      deleteRule: `${auth} && (${isAdmin})`,
    });

    // --- profiles (public read, owner write) ---
    set("profiles", {
      listRule: "",
      viewRule: "",
      createRule: `${auth} && user_id = @request.auth.id`,
      updateRule: `${auth} && user_id = @request.auth.id`,
      deleteRule: `${auth} && user_id = @request.auth.id`,
    });

    // --- owner-only personal collections ---
    const ownerOnly = {
      listRule: `${auth} && @request.auth.id = user_id`,
      viewRule: `${auth} && @request.auth.id = user_id`,
      createRule: `${auth} && @request.auth.id = user_id`,
      updateRule: `${auth} && @request.auth.id = user_id`,
      deleteRule: `${auth} && @request.auth.id = user_id`,
    };
    set("follows", { ...ownerOnly, updateRule: null });
    set("saved_episodes", { ...ownerOnly, updateRule: null });
    set("listening_history", ownerOnly);
    set("playlists", ownerOnly);

    // playlist_items ownership flows through the parent playlist
    set("playlist_items", {
      listRule: `${auth} && playlist_id.user_id = @request.auth.id`,
      viewRule: `${auth} && playlist_id.user_id = @request.auth.id`,
      createRule: `${auth} && playlist_id.user_id = @request.auth.id`,
      updateRule: `${auth} && playlist_id.user_id = @request.auth.id`,
      deleteRule: `${auth} && playlist_id.user_id = @request.auth.id`,
    });
  },
  (app) => {
    // revert to the original foundation rules
    const auth = "@request.auth.id != ''";
    const set = (name, rules) => {
      const c = app.findCollectionByNameOrId(name);
      Object.assign(c, rules);
      app.save(c);
    };
    const pub = { listRule: "", viewRule: "" };
    set("podcasts", { ...pub, createRule: `${auth} && @request.auth.id = creator_id`, updateRule: `${auth} && @request.auth.id = creator_id`, deleteRule: `${auth} && @request.auth.id = creator_id` });
    set("episodes", { ...pub, createRule: auth, updateRule: auth, deleteRule: auth });
    set("podcast_team_members", { ...pub, createRule: auth, updateRule: auth, deleteRule: auth });
    set("creator_profiles", { ...pub, createRule: `${auth} && @request.auth.id = user_id`, updateRule: `${auth} && @request.auth.id = user_id`, deleteRule: `${auth} && @request.auth.id = user_id` });
    set("user_roles", { listRule: `${auth} && @request.auth.id = user_id`, viewRule: `${auth} && @request.auth.id = user_id`, createRule: null, updateRule: null, deleteRule: null });
    set("profiles", { ...pub, createRule: `${auth} && @request.auth.id = user_id`, updateRule: `${auth} && @request.auth.id = user_id`, deleteRule: `${auth} && @request.auth.id = user_id` });
  },
);
