// One-time production reconciliation — safe to delete after use.
// Applies ONLY the two things genuinely missing on production:
//   1. Admin.avatarUrl column
//   2. Comment table: newsId -> articleId (table is confirmed empty, safe)
// Everything else the failed migration tried to create already exists on
// production (created outside migration tracking at some earlier point).
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run(label, sql) {
  await prisma.$executeRawUnsafe(sql);
  console.log('OK:', label);
}

async function main() {
  await run(
    'Admin.avatarUrl',
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'Admin' AND column_name = 'avatarUrl'
       ) THEN
         ALTER TABLE "Admin" ADD COLUMN "avatarUrl" TEXT;
       END IF;
     END $$;`
  );

  await run(
    'Comment.newsId -> drop',
    `DO $$
     BEGIN
       IF EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'Comment' AND column_name = 'newsId'
       ) THEN
         ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_newsId_fkey";
         ALTER TABLE "Comment" DROP COLUMN "newsId";
       END IF;
     END $$;`
  );

  await run(
    'Comment.articleId -> add',
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'Comment' AND column_name = 'articleId'
       ) THEN
         ALTER TABLE "Comment" ADD COLUMN "articleId" TEXT NOT NULL;
       END IF;
     END $$;`
  );

  await run(
    'Comment_articleId_createdAt_idx',
    `CREATE INDEX IF NOT EXISTS "Comment_articleId_createdAt_idx" ON "Comment"("articleId","createdAt");`
  );

  await run(
    'Comment_articleId_fkey',
    `DO $$
     BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'Comment_articleId_fkey'
       ) THEN
         ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey"
           FOREIGN KEY ("articleId") REFERENCES "Article"("id")
           ON DELETE RESTRICT ON UPDATE CASCADE;
       END IF;
     END $$;`
  );

  console.log('Done — production schema now matches the migration.');
}

main()
  .catch((e) => {
    console.error('FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
