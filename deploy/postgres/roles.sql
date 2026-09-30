-- Human-reviewed preparation only; execute as carrion_admin before migrations.
-- Passwords MUST be set separately using interactive psql \password, never SQL files.
\set ON_ERROR_STOP on
CREATE ROLE carrion_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE carrion_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
ALTER DATABASE carrion_network OWNER TO carrion_migrator;
REVOKE ALL ON DATABASE carrion_network FROM PUBLIC;
GRANT CONNECT ON DATABASE carrion_network TO carrion_app;
ALTER SCHEMA public OWNER TO carrion_migrator;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO carrion_app;
