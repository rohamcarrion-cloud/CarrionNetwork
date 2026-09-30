-- Execute as carrion_migrator after deliberate migrations, in carrion_network.
\set ON_ERROR_STOP on
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO carrion_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO carrion_app;
REVOKE ALL ON public.schema_migrations FROM carrion_app;
GRANT SELECT ON public.schema_migrations TO carrion_app;
-- No future default grants: review new tables on each migration release.
-- Runtime has no schema CREATE, object ownership, role administration or migration DDL.
