// src/users/guest.controller.ts
// Public, unauthenticated endpoint — lets any app install register for
// breaking-news push before (or without ever) logging in. Deliberately has
// no guards: most Reader App installs never create an account, since login
// is only required after the free-article limit.
import { Controller, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RegisterGuestPushTokenDto } from './users.dto';

@ApiTags('Guest (Public)')
@Controller('guest')
export class GuestController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('push-token')
  @ApiOperation({ summary: "Register a device's push token without requiring login" })
  registerGuestPushToken(@Body() dto: RegisterGuestPushTokenDto) {
    return this.usersService.registerGuestPushToken(dto);
  }
}
