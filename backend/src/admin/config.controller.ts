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
  @ApiOperation({ summary: 'Public feature-flag config for client apps' })
  async getPublicConfig() {
    const { data } = await this.adminService.getAppConfig();
    // Only expose flags relevant to client apps — defaults applied if unset.
    return {
      data: {
        loginGate: data.loginGate ?? true,
        breakingAlerts: data.breakingAlerts ?? true,
        maintenanceMode: data.maintenanceMode ?? false,
      },
    };
  }
}
