SELECT count(*) AS comment_rows FROM "Comment";
SELECT table_name FROM information_schema.tables WHERE table_name IN ('MediaFile','AppConfig','LocalAd','Team');
SELECT column_name FROM information_schema.columns WHERE table_name = 'Admin' AND column_name = 'avatarUrl';
SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count FROM "_prisma_migrations" ORDER BY started_at DESC;
