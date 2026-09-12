import { Controller, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post(':id/invites')
  @Roles('OWNER', 'ADMIN') // Only owners or admins can invite
  async inviteMember(
    @Param('id') id: string,
    @Body('email') email: string,
    @Request() req: any,
  ) {
    // In a real app, ensure req.user.organizationId matches the param ID
    const inviterName = req.user.firstName || req.user.email;
    return this.organizationsService.inviteMember(id, email, inviterName);
  }
}
