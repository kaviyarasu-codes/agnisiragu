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
      },
    };
  }
}
