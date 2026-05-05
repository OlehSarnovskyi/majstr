import {
  Controller,
  Post,
  Delete,
  Body,
  Get,
  Query,
  Patch,
  UseGuards,
  Request,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { Role } from '@prisma/client';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'avatars');

// One-time OAuth code store: code → { accessToken, isNewUser, expiresAt }
// Codes expire in 60 s and are deleted on first use.
const oauthCodes = new Map<string, { accessToken: string; isNewUser: boolean; expiresAt: number }>();

// Prune expired codes every 5 minutes so the Map doesn't grow unboundedly.
// .unref() lets Node / Jest exit without waiting for this timer.
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of oauthCodes) {
    if (val.expiresAt < now) oauthCodes.delete(key);
  }
}, 5 * 60 * 1000).unref();
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ auth: { limit: 5, ttl: 900000 } }) // 5 registrations per 15 min
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ auth: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 min
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  googleAuth(@Res() res: Response) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      return res.redirect(`${frontendUrl}/auth/login`);
    }

    // Stateless CSRF protection: state = random.HMAC(random)
    // No cookie needed — works across different domains (Vercel + Render)
    const random = crypto.randomBytes(16).toString('hex');
    const secret = process.env.JWT_SECRET || 'dev-only-secret-change-in-production';
    const hmac = crypto.createHmac('sha256', secret).update(random).digest('hex');
    const state = `${random}.${hmac}`;

    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/google/callback';

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'email profile',
      state,
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Request()
    req: {
      user: {
        googleId: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar?: string;
      };
    },
    @Query('state') state: string,
    @Res() res: Response
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    // Verify stateless HMAC state (no cookie required)
    if (!state || !state.includes('.')) {
      return res.redirect(`${frontendUrl}/auth/login?error=oauth_error`);
    }

    const [random, receivedHmac] = state.split('.');
    const secret = process.env.JWT_SECRET || 'dev-only-secret-change-in-production';
    const expectedHmac = crypto.createHmac('sha256', secret).update(random).digest('hex');

    let valid = false;
    try {
      valid = crypto.timingSafeEqual(
        Buffer.from(expectedHmac, 'hex'),
        Buffer.from(receivedHmac, 'hex')
      );
    } catch {
      valid = false;
    }

    if (!valid) {
      return res.redirect(`${frontendUrl}/auth/login?error=oauth_error`);
    }

    const result = await this.authService.googleLogin(req.user);

    // Issue a short-lived one-time code instead of putting the JWT in the URL.
    // The frontend exchanges the code for the token via POST /auth/exchange-code.
    const code = crypto.randomBytes(32).toString('hex');
    oauthCodes.set(code, {
      accessToken: result.accessToken,
      isNewUser: result.isNewUser,
      expiresAt: Date.now() + 60_000, // 60 seconds
    });

    const params = new URLSearchParams({ code });
    res.redirect(`${frontendUrl}/auth/callback?${params}`);
  }

  /** Exchange a one-time OAuth code for a JWT. The code is single-use and expires in 60 s. */
  @Post('exchange-code')
  exchangeCode(@Body() body: { code: string }) {
    const entry = body.code && oauthCodes.get(body.code);
    if (!entry || entry.expiresAt < Date.now()) {
      oauthCodes.delete(body.code); // clean up expired entry if present
      throw new UnauthorizedException('Invalid or expired code');
    }
    oauthCodes.delete(body.code); // single-use
    return { accessToken: entry.accessToken, isNewUser: entry.isNewUser };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.validateUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('role')
  updateRole(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateRoleDto
  ) {
    return this.authService.updateRole(req.user.id, dto.role as Role, dto.phone, dto.city, dto.workingHours);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          // Derive extension from MIME type whitelist — never trust originalname,
          // which can be spoofed (e.g. avatar.jpg.exe → exe leaks through extname()).
          const extByMime: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
          };
          const ext = extByMime[file.mimetype];
          if (!ext) {
            return cb(new BadRequestException('Unsupported image type'), '');
          }
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + ext);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
          cb(new BadRequestException('Only JPEG, PNG and WebP images are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    })
  )
  uploadAvatar(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const avatarUrl = `/api/uploads/avatars/${file.filename}`;
    return this.authService.updateAvatar(req.user.id, avatarUrl);
  }

  @Throttle({ auth: { limit: 10, ttl: 900000 } }) // 10 per 15 min
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token is required');
    return this.authService.verifyEmail(token);
  }

  @Throttle({ auth: { limit: 3, ttl: 900000 } }) // 3 per 15 min
  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  resendVerification(@Request() req: { user: { id: string } }) {
    return this.authService.resendVerificationEmail(req.user.id);
  }

  @Throttle({ auth: { limit: 3, ttl: 900000 } }) // 3 attempts per 15 min
  @Post('resend-verification-email')
  resendVerificationByEmail(@Body() dto: { email: string }) {
    return this.authService.resendVerificationEmailByEmail(dto.email);
  }

  @Throttle({ auth: { limit: 3, ttl: 900000 } }) // 3 attempts per 15 min
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Throttle({ auth: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 min
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  deleteAccount(@Request() req: { user: { id: string } }) {
    return this.authService.deleteAccount(req.user.id);
  }
}
