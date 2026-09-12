import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (user && (await bcrypt.compare(loginDto.password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    
    const defaultMembership = user.memberships[0];

    const payload = { 
      sub: user.id, 
      email: user.email,
      organizationId: defaultMembership?.organizationId,
      role: defaultMembership?.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      organization: defaultMembership?.organization,
    };
  }

  async register(registerDto: RegisterDto) {
    let user;

    if (registerDto.inviteToken) {
      try {
        const payload = this.jwtService.verify(registerDto.inviteToken);
        if (payload.email !== registerDto.email) {
          throw new BadRequestException('Email does not match invite');
        }
        user = await this.usersService.createUserWithInvite(registerDto, payload.organizationId);
      } catch (e) {
        throw new BadRequestException('Invalid or expired invite token');
      }
    } else {
      user = await this.usersService.createUserWithOrganization(registerDto);
    }

    const defaultMembership = user.memberships[0];

    const jwtPayload = { 
      sub: user.id, 
      email: user.email,
      organizationId: defaultMembership?.organizationId,
      role: defaultMembership?.role 
    };

    return {
      access_token: this.jwtService.sign(jwtPayload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      organization: defaultMembership?.organization,
    };
  }
}
