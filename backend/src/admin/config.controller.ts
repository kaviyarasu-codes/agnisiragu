// src/admin/config.controller.ts
// Public, unauthenticated endpoint — Reader/Reporter apps poll this on launch
// to read feature flags (loginGate, breakingAlerts, maintenanceMode, ...).
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Config (Public)')
@Controller('config')
export class ConfigController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Public feature-flag + layout config for client apps' })
  async getPublicConfig() {
    const { data } = await this.adminService.getAppConfig();
    // Only expose fields relevant to client apps — defaults applied if unset.
    return {
      data: {
        // Feature flags
        loginGate: data.loginGate ?? true,
        breakingAlerts: data.breakingAlerts ?? true,
        maintenanceMode: data.maintenanceMode ?? false,
        freeArticleLimit: data.freeArticleLimit ?? 10,

        // Home layout
        homeHeroStyle: data.homeHeroStyle ?? 'slider',
        homeShowBreakingBar: data.homeShowBreakingBar ?? true,
        homeSectionOrder: data.homeSectionOrder ?? ['breaking', 'categories', 'feed'],

        // Widgets
        widgetBreakingBanner: data.widgetBreakingBanner ?? true,
        widgetCategoryTabs: data.widgetCategoryTabs ?? true,

        // Bottom navigation
        navTabs: data.navTabs ?? null, // null = client uses its own defaults
        navShowLabels: data.navShowLabels ?? true,

        // Side menu
        sideMenuEnabled: data.sideMenuEnabled ?? true,
        sideMenuShowProfile: data.sideMenuShowProfile ?? true,
        sideMenuShowBookmarks: data.sideMenuShowBookmarks ?? true,
        sideMenuShowDarkMode: data.sideMenuShowDarkMode ?? true,
        sideMenuShowLanguage: data.sideMenuShowLanguage ?? true,
        sideMenuShowContact: data.sideMenuShowContact ?? true,

        // News sections
        pinnedCategorySlugs: data.pinnedCategorySlugs ?? [],
        newsShowSeeAll: data.newsShowSeeAll ?? true,

        // Advertisement placement
        adInFeedFrequency: data.adInFeedFrequency ?? 5,
        localAdsEnable: data.localAdsEnable ?? true,
        admobEnable: data.admobEnable ?? false,

        // Splash screen — these five defaults previously didn't match the
        // design or the reader app's own local fallback (app.store.ts's
        // DEFAULT_CONFIG): bg was black instead of the warm cream '#F5F1EB',
        // duration was 1200ms (cuts the 3.4s wing-animation loop off before
        // it even settles), animation was 'fade' instead of 'wings', and
        // both taglines were different copy entirely. Since no admin has
        // ever explicitly set these keys, every launch was silently
        // overridden by these wrong backend defaults. Aligned all five to
        // match the design now — takes effect immediately on next launch,
        // no new app build required.
        splashBgColor: data.splashBgColor ?? '#F5F1EB',
        splashDurationMs: data.splashDurationMs ?? 3400,
        splashAnimation: data.splashAnimation ?? 'wings',
        splashLogoUrl: data.splashLogoUrl ?? null,
        splashShowTagline: data.splashShowTagline ?? true,
        splashTaglineTa: data.splashTaglineTa ?? 'உங்கள் ஊர் செய்திகள்',
        splashTaglineEn: data.splashTaglineEn ?? 'Your town, your news',

        // Theme
        defaultThemeMode: data.defaultThemeMode ?? 'system',

        // Rate ticker strip (sponsor credit + gold/silver rates) shown under
        // the Home feed — previously hardcoded in the reader app.
        rateTickerEnabled: data.rateTickerEnabled ?? true,
        rateTickerSponsorName: data.rateTickerSponsorName ?? 'ஸ்ரீ லக்ஷ்மி நகைமாளிகை',
        rateTickerGoldRate: data.rateTickerGoldRate ?? '₹7,240',
        rateTickerSilverRate: data.rateTickerSilverRate ?? '₹96',

        // Onboarding carousel (first-launch slides, before language/district)
        onboardingSlides: data.onboardingSlides ?? [
          {
            imageUrl: null,
            titleTa: 'உங்கள் ஊரின் செய்தி, உடனே',
            titleEn: 'Your town\'s news, instantly',
            descTa: 'உங்கள் மாவட்டத்தில் நடப்பதை முதலில் தெரிந்து கொள்ளுங்கள். சரிபார்க்கப்பட்ட செய்திகள் மட்டும்.',
            descEn: 'Be the first to know what\'s happening in your district. Verified news only.',
          },
          {
            imageUrl: null,
            titleTa: 'உள்ளூர் மக்களே நிருபர்கள்',
            titleEn: 'Locals are the reporters',
            descTa: 'உங்கள் பகுதியில் நடப்பதை நீங்களே பதிவு செய்யலாம் — ஆசிரியர் குழு சரிபார்த்த பிறகு உடனே வெளியிடப்படும்.',
            descEn: 'Report what\'s happening in your area yourself — published instantly after editorial review.',
          },
          {
            imageUrl: null,
            titleTa: 'எழுதி சம்பாதியுங்கள்',
            titleEn: 'Write and earn',
            descTa: 'தொடர்ந்து செய்தி அளிக்கும் நிருபர்களுக்கு புள்ளிகள் மற்றும் அதிகாரப்பூர்வ பத்திரிகையாளர் அடையாள அட்டை.',
            descEn: 'Consistent reporters earn points and an official Press ID card.',
          },
        ],

        // Setup-flow screens (notification/location permission asks, terms &
        // privacy, about/contact) — admin-editable in App Configuration.
        // Defaults below match the reader app's own local fallback
        // (app.store.ts's DEFAULT_CONFIG) so an unset key never regresses
        // the copy the app already ships with.
        notifPermissionScreen: data.notifPermissionScreen ?? {
          titleTa: 'முக்கிய செய்திகளை உடனே அறியுங்கள்',
          titleEn: 'Know important news instantly',
          descTa: 'உங்கள் மாவட்டத்தில் அவசர செய்தி வரும்போது மட்டும் அறிவிப்பு அனுப்புவோம். நாளொன்றுக்கு 2–3 மட்டுமே.',
          descEn: "We'll only notify you when there's urgent news in your district — just 2-3 a day.",
          bullets: [
            { labelTa: 'அவசர செய்தி எச்சரிக்கை', labelEn: 'Breaking news alerts', on: true },
            { labelTa: 'உங்கள் ஊர் செய்திகள்', labelEn: 'News from your town', on: true },
            { labelTa: 'விளம்பரம் இல்லை', labelEn: 'No spam', on: false },
          ],
          buttonLabelTa: 'அனுமதி அளி',
          buttonLabelEn: 'Allow',
          skipLabelTa: 'இப்போது வேண்டாம்',
          skipLabelEn: 'Not now',
        },

        locationPermissionScreen: data.locationPermissionScreen ?? {
          titleTa: 'உங்கள் இருப்பிடத்தை அறிய அனுமதி தேவை',
          titleEn: 'Location access needed',
          descTa: 'இருப்பிட அனுமதி அளித்தால், உங்கள் மாவட்ட செய்திகளை தானாக காட்டுவோம். இதை எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்.',
          descEn: "With location access, we'll automatically show news from your district. You can change this anytime in Settings.",
          bullets: [
            { labelTa: 'உங்கள் மாவட்ட செய்திகள் தானாக தேர்வு', labelEn: 'Auto-select your district news', on: true },
            { labelTa: 'அருகிலுள்ள நிகழ்வுகள் மற்றும் விளம்பரங்கள்', labelEn: 'Nearby events and offers', on: true },
            { labelTa: 'எப்போது வேண்டுமானாலும் அமைப்புகளில் மாற்றலாம்', labelEn: 'Change anytime in Settings', on: false },
          ],
          buttonLabelTa: 'அனுமதி அளி',
          buttonLabelEn: 'Allow',
          skipLabelTa: 'இப்போது வேண்டாம்',
          skipLabelEn: 'Not now',
        },

        // Full text matches the reader app's own local fallback exactly
        // (app.store.ts's DEFAULT_CONFIG.termsScreen) — this endpoint always
        // returns SOME value for this key (falling back to this object when
        // unset), and the client does a shallow merge over its own default,
        // so a short placeholder here would silently blank out the real
        // legal copy on every launch until an admin fills it in.
        termsScreen: data.termsScreen ?? {
          termsTa: `இந்த செயலியை பயன்படுத்துவதன் மூலம் நீங்கள் அக்னிசிறகு பயன்பாட்டு விதிமுறைகளை ஏற்றுக்கொள்கிறீர்கள்.

1. உள்ளடக்கம்: அக்னிசிறகு மூலம் வெளியிடப்படும் அனைத்து செய்திகளும் சரிபார்ப்புக்கு உட்பட்டவை. பயனர்கள் சமர்ப்பிக்கும் செய்திகள் வெளியிடப்படுவதற்கு முன் ஆசிரியர் குழுவால் சரிபார்க்கப்படும்.

2. கணக்கு: தொலைபேசி எண் மூலம் பதிவு செய்யப்படும் கணக்குகள் அந்தந்த பயனருக்கே சொந்தமானவை. தவறான தகவல் அளிப்பது கணக்கு நிறுத்தத்திற்கு வழிவகுக்கும்.

3. நடத்தை: வெறுப்புணர்வு, வன்முறை அல்லது தவறான தகவல்களை பரப்புவது தடைசெய்யப்பட்டது.

4. மாற்றங்கள்: இந்த விதிமுறைகள் அவ்வப்போது புதுப்பிக்கப்படலாம்.`,
          termsEn: `By using this app, you agree to Agnisiragu's terms of use.

1. Content: All news published through Agnisiragu is subject to editorial verification. User-submitted reports are reviewed by our editorial team before publication.

2. Accounts: Accounts registered via phone number belong to the individual user. Providing false information may result in account suspension.

3. Conduct: Hate speech, incitement to violence, or the deliberate spread of misinformation is prohibited.

4. Changes: These terms may be updated from time to time.`,
          privacyTa: `உங்கள் தனியுரிமையை நாங்கள் மதிக்கிறோம்.

1. சேகரிக்கப்படும் தகவல்கள்: தொலைபேசி எண், விருப்பமான மொழி, மாவட்டம் மற்றும் பயன்பாட்டு புள்ளிவிவரங்கள்.

2. பயன்பாடு: உங்கள் தகவல்கள் செய்திகளை தனிப்பயனாக்கவும், அறிவிப்புகள் அனுப்பவும் மட்டுமே பயன்படுத்தப்படும்.

3. பகிர்வு: உங்கள் தனிப்பட்ட தகவல்கள் மூன்றாம் தரப்பினருடன் விற்கப்படாது.

4. தொடர்பு: தனியுரிமை தொடர்பான கேள்விகளுக்கு எங்களை தொடர்பு கொள்ளுங்கள்.`,
          privacyEn: `We respect your privacy.

1. Information we collect: phone number, language preference, district, and usage analytics.

2. Use: your information is used only to personalize news and send relevant alerts.

3. Sharing: your personal information is never sold to third parties.

4. Contact: reach out to us with any privacy-related questions.`,
        },

        aboutScreen: data.aboutScreen ?? {
          descTa: 'உங்கள் ஊர் செய்திகளை உங்கள் மொழியில், சரிபார்க்கப்பட்ட நிருபர்களிடமிருந்து.',
          descEn: "Your town's news, in your language, from verified reporters.",
          helpUrl: 'https://agnisiragu.com/help',
          helpEnabled: true,
          contactEmail: 'agni360tn@gmail.com',
          contactEnabled: true,
          advertiseEmail: 'ads@agnisiragu.com',
          advertiseEnabled: true,
          rateUsEnabled: true,
          playStoreUrl: 'https://play.google.com/store/apps/details?id=com.agnisiragu.reader',
          appStoreUrl: 'https://apps.apple.com/app/agnisiragu',
        },

        languageDistrictScreen: data.languageDistrictScreen ?? {
          taglineTa: 'உங்கள் ஊர் செய்திகள், ஒரே இடத்தில்',
          taglineEn: 'Your town\'s news, all in one place',
        },
      },
    };
  }
}
