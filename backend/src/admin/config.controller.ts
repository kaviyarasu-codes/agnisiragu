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

        // Splash screen
        splashBgColor: data.splashBgColor ?? '#000000',
        splashDurationMs: data.splashDurationMs ?? 1200,
        // Was defaulting to 'fade' here while the reader app's own local
        // default (app.store.ts's DEFAULT_CONFIG) is 'wings' — since no
        // admin had ever explicitly set this key in App Config, every
        // launch fetched 'fade' from the backend and silently overrode the
        // client's default, so the app always showed the old plain logo
        // splash (no wing animation, no "AGNISIRAGU NEWS" watermark text,
        // which only exists inside WingSplash). Aligning the default here
        // fixes it for the already-live build too, since this is fetched
        // fresh on every app launch — no new build required.
        splashAnimation: data.splashAnimation ?? 'wings',
        splashLogoUrl: data.splashLogoUrl ?? null,
        splashShowTagline: data.splashShowTagline ?? true,
        splashTaglineTa: data.splashTaglineTa ?? 'உண்மையை உரக்கச் சொல்வோம்',
        splashTaglineEn: data.splashTaglineEn ?? 'Truth, Told Loud',

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
      },
    };
  }
}
