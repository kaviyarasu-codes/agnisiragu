-- PostgreSQL production hardening
ALTER SYSTEM SET log_min_duration_statement = '1000';  -- Log slow queries > 1s
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
ALTER SYSTEM SET max_connections = '100';
SELECT pg_reload_conf();
