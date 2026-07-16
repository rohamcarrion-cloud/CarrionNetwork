/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // --- extend users with username ---
    if (!users.fields.getByName("username")) {
      users.fields.add(
        new TextField({ name: "username", max: 40, required: false }),
      );
    }
    users.listRule = "id = @request.auth.id";
    users.viewRule = "@request.auth.id != ''";
    users.createRule = "";
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = "id = @request.auth.id";
    app.save(users);
    try {
      users.addIndex("idx_users_username", true, "username", "username != ''");
      app.save(users);
    } catch (_) {}

    const usersId = users.id;
    const ownerRead = "@request.auth.id != ''";
    const auth = "@request.auth.id != ''";

    const rel = (name, collectionId, opts = {}) => ({
      name,
      type: "relation",
      required: opts.required ?? false,
      maxSelect: 1,
      collectionId,
      cascadeDelete: opts.cascadeDelete ?? false,
    });
    const created = { name: "created", type: "autodate", onCreate: true, onUpdate: false };
    const updated = { name: "updated", type: "autodate", onCreate: true, onUpdate: true };

    const collections = {};
    const make = (def) => {
      let c;
      try {
        c = app.findCollectionByNameOrId(def.name);
      } catch (_) {
        c = new Collection(def);
        app.save(c);
      }
      collections[def.name] = c;
      return c;
    };

    // 3. roles
    make({
      type: "base",
      name: "roles",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "name", type: "text", required: true, max: 40 },
        { name: "description", type: "text", max: 300 },
        created,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_roles_name ON roles (name)"],
    });

    // 8. categories
    make({
      type: "base",
      name: "categories",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "name", type: "text", required: true, max: 80 },
        { name: "slug", type: "text", required: true, max: 80 },
        { name: "description", type: "text", max: 300 },
        { name: "icon", type: "text", max: 60 },
        created,
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_categories_name ON categories (name)",
        "CREATE UNIQUE INDEX idx_categories_slug ON categories (slug)",
      ],
    });

    // 16. plans
    make({
      type: "base",
      name: "plans",
      listRule: "",
      viewRule: "",
      fields: [
        { name: "name", type: "text", required: true, max: 40 },
        { name: "description", type: "text", max: 400 },
        { name: "price_monthly", type: "number", min: 0 },
        { name: "features", type: "json", maxSize: 200000 },
        created,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_plans_name ON plans (name)"],
    });

    // 2. profiles
    make({
      type: "base",
      name: "profiles",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != '' && @request.auth.id = user_id",
      updateRule: "@request.auth.id != '' && @request.auth.id = user_id",
      deleteRule: "@request.auth.id != '' && @request.auth.id = user_id",
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        { name: "display_name", type: "text", max: 100 },
        { name: "bio", type: "text", max: 1000 },
        { name: "avatar_url", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
        { name: "location", type: "text", max: 120 },
        { name: "website", type: "url" },
        created,
        updated,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_profiles_user ON profiles (user_id)"],
    });

    // 4. user_roles
    make({
      type: "base",
      name: "user_roles",
      listRule: "@request.auth.id != '' && @request.auth.id = user_id",
      viewRule: "@request.auth.id != '' && @request.auth.id = user_id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        rel("role_id", collections["roles"].id, { required: true, cascadeDelete: true }),
        { name: "assigned_at", type: "autodate", onCreate: true, onUpdate: false },
        rel("assigned_by", usersId, {}),
        created,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_user_roles ON user_roles (user_id, role_id)"],
    });

    // 5. creator_profiles
    make({
      type: "base",
      name: "creator_profiles",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != '' && @request.auth.id = user_id",
      updateRule: "@request.auth.id != '' && @request.auth.id = user_id",
      deleteRule: "@request.auth.id != '' && @request.auth.id = user_id",
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        { name: "podcast_count", type: "number", min: 0 },
        { name: "bio", type: "text", max: 1000 },
        { name: "website", type: "url" },
        { name: "verified", type: "bool" },
        created,
        updated,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_creator_profiles_user ON creator_profiles (user_id)"],
    });

    // 6. podcasts
    make({
      type: "base",
      name: "podcasts",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.id != '' && @request.auth.id = creator_id",
      updateRule: "@request.auth.id != '' && @request.auth.id = creator_id",
      deleteRule: "@request.auth.id != '' && @request.auth.id = creator_id",
      fields: [
        rel("creator_id", usersId, { required: true, cascadeDelete: true }),
        { name: "title", type: "text", required: true, max: 200 },
        { name: "slug", type: "text", required: true, max: 200 },
        { name: "description", type: "text", max: 5000 },
        { name: "artwork_url", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
        rel("category_id", collections["categories"].id, {}),
        { name: "status", type: "select", maxSelect: 1, values: ["draft", "published", "archived"] },
        created,
        updated,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_podcasts_slug ON podcasts (slug)"],
    });

    // 7. podcast_team_members
    make({
      type: "base",
      name: "podcast_team_members",
      listRule: "",
      viewRule: "",
      createRule: auth,
      updateRule: auth,
      deleteRule: auth,
      fields: [
        rel("podcast_id", collections["podcasts"].id, { required: true, cascadeDelete: true }),
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        { name: "role", type: "select", maxSelect: 1, values: ["owner", "editor", "guest"] },
        created,
      ],
    });

    // 9. episodes
    make({
      type: "base",
      name: "episodes",
      listRule: "",
      viewRule: "",
      createRule: auth,
      updateRule: auth,
      deleteRule: auth,
      fields: [
        rel("podcast_id", collections["podcasts"].id, { required: true, cascadeDelete: true }),
        { name: "title", type: "text", required: true, max: 250 },
        { name: "slug", type: "text", max: 250 },
        { name: "description", type: "text", max: 5000 },
        { name: "artwork_url", type: "file", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] },
        { name: "status", type: "select", maxSelect: 1, values: ["draft", "scheduled", "published", "archived"] },
        { name: "published_at", type: "date" },
        created,
        updated,
      ],
    });

    // 10. follows
    make({
      type: "base",
      name: "follows",
      listRule: "@request.auth.id != '' && @request.auth.id = user_id",
      viewRule: "@request.auth.id != '' && @request.auth.id = user_id",
      createRule: "@request.auth.id != '' && @request.auth.id = user_id",
      updateRule: null,
      deleteRule: "@request.auth.id != '' && @request.auth.id = user_id",
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        rel("podcast_id", collections["podcasts"].id, { required: true, cascadeDelete: true }),
        created,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_follows ON follows (user_id, podcast_id)"],
    });

    // 11. saved_episodes
    make({
      type: "base",
      name: "saved_episodes",
      listRule: "@request.auth.id != '' && @request.auth.id = user_id",
      viewRule: "@request.auth.id != '' && @request.auth.id = user_id",
      createRule: "@request.auth.id != '' && @request.auth.id = user_id",
      updateRule: null,
      deleteRule: "@request.auth.id != '' && @request.auth.id = user_id",
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        rel("episode_id", collections["episodes"].id, { required: true, cascadeDelete: true }),
        created,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_saved_episodes ON saved_episodes (user_id, episode_id)"],
    });

    // 12. playlists
    make({
      type: "base",
      name: "playlists",
      listRule: "@request.auth.id != '' && (@request.auth.id = user_id || is_public = true)",
      viewRule: "@request.auth.id != '' && (@request.auth.id = user_id || is_public = true)",
      createRule: "@request.auth.id != '' && @request.auth.id = user_id",
      updateRule: "@request.auth.id != '' && @request.auth.id = user_id",
      deleteRule: "@request.auth.id != '' && @request.auth.id = user_id",
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        { name: "title", type: "text", required: true, max: 150 },
        { name: "description", type: "text", max: 1000 },
        { name: "is_public", type: "bool" },
        created,
        updated,
      ],
    });

    // 13. playlist_items
    make({
      type: "base",
      name: "playlist_items",
      listRule: auth,
      viewRule: auth,
      createRule: auth,
      updateRule: auth,
      deleteRule: auth,
      fields: [
        rel("playlist_id", collections["playlists"].id, { required: true, cascadeDelete: true }),
        rel("episode_id", collections["episodes"].id, { required: true, cascadeDelete: true }),
        { name: "position", type: "number", min: 0 },
        created,
      ],
    });

    // 14. listening_history
    make({
      type: "base",
      name: "listening_history",
      listRule: "@request.auth.id != '' && @request.auth.id = user_id",
      viewRule: "@request.auth.id != '' && @request.auth.id = user_id",
      createRule: "@request.auth.id != '' && @request.auth.id = user_id",
      updateRule: "@request.auth.id != '' && @request.auth.id = user_id",
      deleteRule: "@request.auth.id != '' && @request.auth.id = user_id",
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        rel("episode_id", collections["episodes"].id, { required: true, cascadeDelete: true }),
        { name: "position_seconds", type: "number", min: 0 },
        { name: "completed", type: "bool" },
        { name: "last_played", type: "date" },
        created,
        updated,
      ],
    });

    // 15. notifications
    make({
      type: "base",
      name: "notifications",
      listRule: "@request.auth.id != '' && @request.auth.id = user_id",
      viewRule: "@request.auth.id != '' && @request.auth.id = user_id",
      createRule: auth,
      updateRule: "@request.auth.id != '' && @request.auth.id = user_id",
      deleteRule: "@request.auth.id != '' && @request.auth.id = user_id",
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        { name: "type", type: "select", maxSelect: 1, values: ["follow", "new_episode", "message", "system"] },
        { name: "title", type: "text", required: true, max: 200 },
        { name: "message", type: "text", max: 1000 },
        { name: "read", type: "bool" },
        rel("related_podcast_id", collections["podcasts"].id, {}),
        rel("related_episode_id", collections["episodes"].id, {}),
        created,
      ],
    });

    // 17. subscriptions
    make({
      type: "base",
      name: "subscriptions",
      listRule: "@request.auth.id != '' && @request.auth.id = user_id",
      viewRule: "@request.auth.id != '' && @request.auth.id = user_id",
      createRule: "@request.auth.id != '' && @request.auth.id = user_id",
      updateRule: "@request.auth.id != '' && @request.auth.id = user_id",
      deleteRule: null,
      fields: [
        rel("user_id", usersId, { required: true, cascadeDelete: true }),
        rel("plan_id", collections["plans"].id, { required: true }),
        { name: "status", type: "select", maxSelect: 1, values: ["active", "canceled", "expired"] },
        { name: "started_at", type: "date" },
        { name: "expires_at", type: "date" },
        created,
        updated,
      ],
    });

    // --- seed roles ---
    const rolesCol = collections["roles"];
    const roleSeed = [
      { name: "listener", description: "Default role for all users. Can discover, follow, save, and listen." },
      { name: "creator", description: "Can create and manage podcasts and episodes." },
      { name: "admin", description: "Full platform administration access." },
    ];
    for (const data of roleSeed) {
      try {
        app.findFirstRecordByData("roles", "name", data.name);
      } catch (_) {
        const r = new Record(rolesCol);
        r.load(data);
        app.save(r);
      }
    }

    // --- seed categories ---
    const catCol = collections["categories"];
    const catSeed = [
      { name: "Business", slug: "business", icon: "Briefcase", description: "Strategy, operations, and growth." },
      { name: "Entrepreneurship", slug: "entrepreneurship", icon: "Rocket", description: "Founders and startups." },
      { name: "Education", slug: "education", icon: "GraduationCap", description: "Learning and teaching." },
      { name: "Technology", slug: "technology", icon: "Cpu", description: "Software, hardware, and the web." },
      { name: "AI", slug: "ai", icon: "Sparkles", description: "Machine learning and AI." },
      { name: "Finance", slug: "finance", icon: "LineChart", description: "Markets, investing, and money." },
      { name: "Leadership", slug: "leadership", icon: "Users", description: "Management and culture." },
      { name: "Real Estate", slug: "real-estate", icon: "Building2", description: "Property and investment." },
      { name: "Career", slug: "career", icon: "TrendingUp", description: "Professional development." },
    ];
    for (const data of catSeed) {
      try {
        app.findFirstRecordByData("categories", "slug", data.slug);
      } catch (_) {
        const r = new Record(catCol);
        r.load(data);
        app.save(r);
      }
    }

    // --- seed plans ---
    const planCol = collections["plans"];
    const planSeed = [
      { name: "free", description: "For listeners who want to explore.", price_monthly: 0, features: ["Unlimited listening", "Follow shows", "Create playlists", "Listening history"] },
      { name: "creator", description: "For creators launching their first shows.", price_monthly: 12, features: ["Everything in Free", "Publish podcasts", "Recording studio", "Basic analytics", "Distribution"] },
      { name: "pro", description: "For professional networks and teams.", price_monthly: 29, features: ["Everything in Creator", "Advanced analytics", "Team collaboration", "Monetization", "Priority support"] },
    ];
    for (const data of planSeed) {
      try {
        app.findFirstRecordByData("plans", "name", data.name);
      } catch (_) {
        const r = new Record(planCol);
        r.load(data);
        app.save(r);
      }
    }
  },
  (app) => {
    const names = [
      "subscriptions", "notifications", "listening_history", "playlist_items",
      "playlists", "saved_episodes", "follows", "episodes", "podcast_team_members",
      "podcasts", "creator_profiles", "user_roles", "profiles", "plans",
      "categories", "roles",
    ];
    for (const n of names) {
      try {
        app.delete(app.findCollectionByNameOrId(n));
      } catch (_) {}
    }
    try {
      const users = app.findCollectionByNameOrId("users");
      users.fields.removeByName("username");
      app.save(users);
    } catch (_) {}
  },
);
