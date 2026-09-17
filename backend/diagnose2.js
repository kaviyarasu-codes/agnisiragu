// Temporary diagnostic script #2 — safe to delete after use.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const enums = await prisma.$queryRawUnsafe(
    `SELECT typname FROM pg_type WHERE typname IN ('CardStyle','AdType','CtaType','AdStatus','AdPlacement','AdminRole')`
  );
  console.log('existing_enum_types:', enums);

  const adminRoleValues = await prisma.$queryRawUnsafe(
    `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'AdminRole' ORDER BY e.enumsortorder`
  );
  console.log('AdminRole_values:', adminRoleValues);

  const articleCols = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'Article' AND column_name IN ('byline','cardStyle','commentCount','dislikeCount','likeCount','mediaUrls','searchText')`
  );
  console.log('article_new_columns:', articleCols);

  const auditLogCols = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'AuditLog' AND column_name = 'device'`
  );
  console.log('auditlog_device_column:', auditLogCols);

  const commentFk = await prisma.$queryRawUnsafe(
    `SELECT conname FROM pg_constraint WHERE conname = 'Comment_newsId_fkey'`
  );
  console.log('comment_newsId_fkey_still_present:', commentFk);
}

main()
  .catch((e) => console.error('ERROR:', e))
  .finally(() => prisma.$disconnect());
