import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });
  }

  async createUserWithOrganization(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user, organization, and membership in a single transaction
    return this.prisma.$transaction(async (tx) => {
      // Create Organization
      // Generate a simple slug based on organization name and random string
      const slugBase = dto.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const slug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;
      
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
        },
      });

      // Create User
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          memberships: {
            create: {
              organizationId: organization.id,
              role: 'OWNER',
            },
          },
        },
        include: {
          memberships: {
            include: { organization: true },
          },
        },
      });

      return user;
    });
  }

  async createUserWithInvite(dto: RegisterDto, organizationId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          memberships: {
            create: {
              organizationId,
              role: 'MEMBER', // Users join as members from invites
            },
          },
        },
        include: {
          memberships: {
            include: { organization: true },
          },
        },
      });

      return user;
    });
  }
}
