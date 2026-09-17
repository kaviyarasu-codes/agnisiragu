// Temporary diagnostic script — safe to delete after use.
// Reads DATABASE_URL from the environment (same $env:DATABASE_URL you already set).
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const commentRows = await prisma.$queryRawUnsafe(
    'SELECT count(*) AS comment_rows FROM "Comment"'
  );
  console.log('comment_rows:', commentRows);

  const tables = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_name IN ('MediaFile','AppConfig','LocalAd','Team')`
  );
  console.log('existing_new_tables:', tables);

  const adminCols = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'Admin' AND column_name IN ('avatarUrl','isActive','phone','teamType')`
  );
  console.log('admin_new_columns:', adminCols);

  const commentCols = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'Comment'`
  );
  console.log('comment_table_columns:', commentCols);

  const migrations = await prisma.$queryRawUnsafe(
    `SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count FROM "_prisma_migrations" ORDER BY started_at DESC`
  );
  console.log('migrations:', migrations);
}

main()
  .catch((e) => console.error('ERROR:', e))
  .finally(() => prisma.$disconnect());
