import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService
  ) {}

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        emailVerificationToken,
      },
    });

    // Send both emails async — don't block registration if they fail
    this.emailService
      .sendEmailVerification(user.email, user.firstName, emailVerificationToken)
      .catch((err) => this.logger.error('Failed to send verification email', err));

    this.emailService
      .sendWelcomeEmail(user.email, user.firstName)
      .catch((err) => this.logger.error('Failed to send welcome email', err));

    // No JWT issued — user must verify email and log in
    return {
      message: 'Registration successful. Please check your email to verify your account.',
      email: user.email,
    };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('E-mail nie je overený');
    }

    return this.buildAuthResponse(user);
  }

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }) {
    let isNewUser = false;

    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            avatar: googleUser.avatar,
          },
        });
      } else {
        isNewUser = true;
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            googleId: googleUser.googleId,
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            avatar: googleUser.avatar,
            emailVerified: true, // Google already verified the email
          },
        });
        // Send welcome email async — don't block login if it fails
        this.emailService
          .sendWelcomeEmail(user.email, user.firstName)
          .catch((err) => this.logger.error('Failed to send welcome email', err));
      }
    }

    return { ...this.buildAuthResponse(user), isNewUser };
  }

  async updateRole(userId: string, role: Role, phone?: string, workingHours?: object) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new UnauthorizedException();
    if (existing.roleChosen) throw new ConflictException('Role already set');

    const resolvedPhone = phone?.trim() || existing.phone?.trim();
    if (role === Role.MASTER && !resolvedPhone) {
      throw new BadRequestException('Telefónne číslo je povinné pre rolu majstra');
    }
    if (role === Role.MASTER && !workingHours) {
      throw new BadRequestException('Pracovný rozvrh je povinný pre rolu majstra');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role,
        roleChosen: true,
        ...(resolvedPhone && { phone: resolvedPhone }),
        ...(workingHours && { workingHours }),
      },
    });
    return this.buildAuthResponse(user);
  }

  async updateProfile(
    userId: string,
    dto: { firstName?: string; lastName?: string; phone?: string; bio?: string; city?: string; workingHours?: object }
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        bio: true,
        city: true,
        role: true,
        roleChosen: true,
        workingHours: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    // Delete all related data (GDPR Art. 17 — right to erasure)
    await this.prisma.booking.deleteMany({
      where: { OR: [{ clientId: userId }, { masterId: userId }] },
    });
    await this.prisma.service.deleteMany({
      where: { masterId: userId },
    });
    await this.prisma.user.delete({
      where: { id: userId },
    });
    return { message: 'Account deleted' };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        bio: true,
        city: true,
        role: true,
        roleChosen: true,
        workingHours: true,
      },
    });
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        bio: true,
        city: true,
        role: true,
        roleChosen: true,
        workingHours: true,
      },
    });
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    // Always return success to prevent user enumeration (GDPR + security)
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      return { message: 'Reset link sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    this.emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken).catch((err) =>
      this.logger.error('Failed to send password reset email', err)
    );

    return { message: 'Reset link sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });

    return { message: 'Password reset successfully' };
  }

  async resendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken },
    });

    this.emailService.sendEmailVerification(user.email, user.firstName, emailVerificationToken).catch((err) =>
      this.logger.error('Failed to send verification email', err)
    );
    return { message: 'Verification email sent' };
  }

  async resendVerificationEmailByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent user enumeration
    if (!user || user.emailVerified || !user.password) return { message: 'Verification email sent' };

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken },
    });

    this.emailService.sendEmailVerification(user.email, user.firstName, emailVerificationToken).catch((err) =>
      this.logger.error('Failed to send verification email by email', err)
    );
    return { message: 'Verification email sent' };
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleChosen: boolean;
    city?: string | null;
    workingHours?: unknown;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roleChosen: user.roleChosen,
        city: user.city ?? null,
        workingHours: user.workingHours ?? null,
      },
    };
  }
}
