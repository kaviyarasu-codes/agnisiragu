// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Agnisiragu database...\n');

  // ── Super Admin ──────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@123456', 12);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@agnisiragu.com' },
    update: {},
    create: {
      email: 'admin@agnisiragu.com',
      passwordHash,
      name: 'Super Admin',
      adminRole: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Super Admin: ${admin.email}`);

  const editor = await prisma.admin.upsert({
    where: { email: 'editor@agnisiragu.com' },
    update: {},
    create: {
      email: 'editor@agnisiragu.com',
      passwordHash: await bcrypt.hash('Editor@123456', 12),
      name: 'Editor One',
      adminRole: 'EDITOR',
    },
  });
  console.log(`✅ Editor: ${editor.email}`);

  // ── Categories ───────────────────────────────────────────
  const categories = [
    { nameTa: 'அரசியல்',      nameEn: 'Politics',       slug: 'politics',       displayOrder: 1 },
    { nameTa: 'விளையாட்டு',   nameEn: 'Sports',          slug: 'sports',         displayOrder: 2 },
    { nameTa: 'சினிமா',       nameEn: 'Cinema',          slug: 'cinema',         displayOrder: 3 },
    { nameTa: 'குற்றம்',      nameEn: 'Crime',            slug: 'crime',          displayOrder: 4 },
    { nameTa: 'தொழில்நுட்பம்', nameEn: 'Technology',     slug: 'technology',     displayOrder: 5 },
    { nameTa: 'வணிகம்',       nameEn: 'Business',        slug: 'business',       displayOrder: 6 },
    { nameTa: 'உள்ளூர்',      nameEn: 'Local',            slug: 'local',          displayOrder: 7 },
    { nameTa: 'சர்வதேசம்',    nameEn: 'International',   slug: 'international',  displayOrder: 8 },
    { nameTa: 'பொழுதுபோக்கு', nameEn: 'Entertainment',   slug: 'entertainment',  displayOrder: 9 },
    { nameTa: 'சுகாதாரம்',    nameEn: 'Health',           slug: 'health',         displayOrder: 10 },
    { nameTa: 'கல்வி',        nameEn: 'Education',        slug: 'education',      displayOrder: 11 },
    { nameTa: 'சமூகம்',       nameEn: 'Society',          slug: 'society',        displayOrder: 12 },
  ];

  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
    console.log(`✅ Category: ${created.nameEn} (${created.nameTa})`);
  }

  // ── Sample Articles ──────────────────────────────────────
  const politicsCategory = await prisma.category.findUnique({ where: { slug: 'politics' } });
  const sportsCategory   = await prisma.category.findUnique({ where: { slug: 'sports' } });
  const cinemaCategory   = await prisma.category.findUnique({ where: { slug: 'cinema' } });

  const sampleArticles = [
    {
      titleTa: 'தமிழகத்தில் புதிய அரசு திட்டங்கள் அறிவிப்பு',
      titleEn: 'New Government Schemes Announced in Tamil Nadu',
      bodyTa: 'தமிழக அரசு இன்று பல்வேறு புதிய திட்டங்களை அறிவித்தது. இந்த திட்டங்கள் மக்களுக்கு பெரும் பயனளிக்கும் என எதிர்பார்க்கப்படுகிறது. முதலமைச்சர் நேரில் இந்த திட்டங்களை அறிவித்தார்.',
      bodyEn: 'The Tamil Nadu government today announced several new schemes. These schemes are expected to benefit the public greatly. The Chief Minister personally announced these schemes.',
      excerpt: 'Tamil Nadu government announces new public welfare schemes.',
      categoryId: politicsCategory!.id,
      adminId: admin.id,
      status: 'PUBLISHED' as const,
      isBreaking: true,
      publishedAt: new Date(),
    },
    {
      titleTa: 'சென்னை சூப்பர் கிங்ஸ் அணி அடுத்த போட்டிக்கு தயார்',
      titleEn: 'Chennai Super Kings Ready for Next Match',
      bodyTa: 'சென்னை சூப்பர் கிங்ஸ் அணி அடுத்த போட்டிக்காக தீவிர பயிற்சியில் ஈடுபட்டுள்ளது. வீரர்கள் சிறப்பான உற்சாகத்தில் உள்ளனர். இந்த போட்டி நாளை மாலை நடைபெறும்.',
      bodyEn: 'Chennai Super Kings are in intense practice for the upcoming match. Players are in excellent spirit. The match will be held tomorrow evening.',
      excerpt: 'CSK gears up for the next high-stakes match.',
      categoryId: sportsCategory!.id,
      adminId: admin.id,
      status: 'PUBLISHED' as const,
      isBreaking: false,
      publishedAt: new Date(),
    },
    {
      titleTa: 'கோலிவுட்டில் புதிய படம் அறிவிப்பு',
      titleEn: 'New Kollywood Film Announced',
      bodyTa: 'கோலிவுட்டில் புதிய படம் இன்று அறிவிக்கப்பட்டது. பிரபல நடிகர் இந்த படத்தில் நடிக்கிறார். படம் இந்த ஆண்டே வெளியாகும் என எதிர்பார்க்கப்படுகிறது.',
      bodyEn: 'A new Kollywood film was announced today. A popular actor stars in this film. The movie is expected to release this year itself.',
      excerpt: 'Exciting new Tamil film announced with popular lead.',
      categoryId: cinemaCategory!.id,
      adminId: admin.id,
      status: 'PUBLISHED' as const,
      isBreaking: false,
      publishedAt: new Date(),
    },
  ];

  for (const article of sampleArticles) {
    const existing = await prisma.article.findFirst({
      where: { titleEn: article.titleEn },
    });
    if (!existing) {
      const created = await prisma.article.create({ data: article });
      console.log(`✅ Article: ${created.titleEn}`);
    } else {
      console.log(`⏭️  Article already exists: ${article.titleEn}`);
    }
  }

  console.log('\n✨ Seed complete!\n');
  console.log('Admin credentials:');
  console.log('  Email:    admin@agnisiragu.com');
  console.log('  Password: Admin@123456\n');
  console.log('Editor credentials:');
  console.log('  Email:    editor@agnisiragu.com');
  console.log('  Password: Editor@123456\n');
  console.log('API base: http://localhost:3000/api/v1');
  console.log('Swagger:  http://localhost:3000/api/docs');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
