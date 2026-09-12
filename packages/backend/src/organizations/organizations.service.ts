import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async inviteMember(organizationId: string, email: string, inviterName: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Generate stateless invite token
    const inviteToken = this.jwtService.sign(
      { email, organizationId, role: 'MEMBER' },
      { expiresIn: '7d' }, // Invite expires in 7 days
    );

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const inviteUrl = `${frontendUrl}/register?inviteToken=${inviteToken}`;

    await this.emailService.sendInviteEmail(email, org.name, inviteUrl);

    return { success: true, message: 'Invite sent' };
  }
}
