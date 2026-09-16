-- NOTE: unused since the platform moved to managed Neon Postgres (Neon
-- doesn't allow ALTER SYSTEM, and manages these settings itself). Kept
-- only for reference if a self-hosted Postgres is ever reintroduced.
-- PostgreSQL production hardening
ALTER SYSTEM SET log_min_duration_statement = '1000';  -- Log slow queries > 1s
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
ALTER SYSTEM SET max_connections = '100';
SELECT pg_reload_conf();
