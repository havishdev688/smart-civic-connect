import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Resend } from 'resend';
import { DbService } from '../services/db.service';

const JWT_SECRET = process.env.JWT_SECRET || 'smart_civic_connect_ap_secret_2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function isDummyPhoneNumber(phone: string): boolean {
  if (phone.length !== 10) return true;
  // All digits identical: e.g. 0000000000, 1111111111, ..., 9999999999
  if (/^(\d)\1{9}$/.test(phone)) return true;

  // Specific common dummy / test numbers
  const knownDummies = new Set([
    '1234567890',
    '0123456789',
    '9876543210',
    '8765432109',
    '0987654321',
    '2345678901',
    '1010101010',
    '0101010101',
    '1212121212',
    '9898989898',
    '9090909090',
    '9999988888',
    '8888899999',
    '7777788888',
  ]);
  if (knownDummies.has(phone)) return true;

  // Check pure sequential patterns: 0123456789 or 9876543210
  const digits = phone.split('').map(Number);
  let isAscending = true;
  let isDescending = true;
  for (let i = 1; i < digits.length; i++) {
    if ((digits[i] - digits[i - 1] + 10) % 10 !== 1) isAscending = false;
    if ((digits[i - 1] - digits[i] + 10) % 10 !== 1) isDescending = false;
  }
  if (isAscending || isDescending) return true;

  return false;
}

export function validateAndNormalizeIndianPhone(input: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Mobile number is required.' };
  }

  let cleaned = input.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Mobile number must contain digits only.' };
  }

  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, error: 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.' };
  }

  if (isDummyPhoneNumber(cleaned)) {
    return { isValid: false, error: 'Please enter a valid Indian mobile number. Test or dummy numbers are not allowed.' };
  }

  return { isValid: true, normalized: cleaned };
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly db: DbService) {}

  /**
   * Citizen / Officer / Admin Login
   * Accepts Email Address OR Mobile Number + Password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException('Email/Mobile and password are required');
    }

    const cleanInput = email.trim();
    const isEmail = cleanInput.includes('@');

    const user = await this.db.user.findFirst({
      where: isEmail
        ? { email: cleanInput.toLowerCase() }
        : { phone: cleanInput },
      include: { department: true }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials. Account not found.');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials. Incorrect password.');
    }

    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.name,
      departmentId: user.departmentId
    }, JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.name,
        phone: user.phone,
      },
    };
  }

  /**
   * Send Real Email OTP for Citizen Registration
   */
  @Post('send-email-otp')
  async sendEmailOtp(@Body() body: { email: string; phone: string; name?: string }) {
    const { email, phone, name } = body;
    if (!email || !email.trim()) {
      throw new BadRequestException('Email address is required.');
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new BadRequestException('Please enter a valid email address.');
    }

    const phoneValidation = validateAndNormalizeIndianPhone(phone);
    if (!phoneValidation.isValid) {
      throw new BadRequestException(phoneValidation.error);
    }
    const normalizedPhone = phoneValidation.normalized!;

    // Check if email or phone is already registered
    const existingEmail = await this.db.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      throw new BadRequestException('An account with this email address already exists. Please log in.');
    }

    const existingPhone = await this.db.user.findFirst({ where: { phone: normalizedPhone } });
    if (existingPhone) {
      throw new BadRequestException('This mobile number is already registered. Please log in.');
    }

    // Rate-limiting / Resend cooldown: check if active OTP created within last 60 seconds
    const recentOtp = await this.db.otpVerification.findFirst({
      where: {
        email: cleanEmail,
        purpose: 'REGISTER',
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentOtp) {
      throw new BadRequestException('Please wait 60 seconds before requesting a new verification code.');
    }

    // Generate secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove any previous unverified OTP records for this email
    await this.db.otpVerification.deleteMany({
      where: { email: cleanEmail, purpose: 'REGISTER' }
    });

    // Save in OtpVerification
    await this.db.otpVerification.create({
      data: {
        email: cleanEmail,
        phone: normalizedPhone,
        otp: hashedOtp,
        purpose: 'REGISTER',
        expiresAt,
        attempts: 0,
        verified: false,
      }
    });

    // Check Resend Email API configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = 'Smart Civic Connect <onboarding@resend.dev>';

    const isEmailConfigured = Boolean(resendApiKey && resendApiKey.trim() !== '');

    if (!isEmailConfigured) {
      throw new BadRequestException('Email service is not configured on the server. Please check RESEND_API_KEY settings.');
    }

    try {
      const resend = new Resend(resendApiKey.trim());
      const { data, error } = await resend.emails.send({
        from: emailFrom.trim(),
        to: cleanEmail,
        subject: 'Your Verification Code - Smart Civic Connect',
        text: `Namaste ${name || 'Citizen'},\n\nYour Smart Civic Connect email verification code is: ${rawOtp}\n\nThis code expires in 10 minutes and can only be used once.\n\nIf you did not request this, please ignore this email.\n\nSmart Civic Connect\nMunicipal Administration & Urban Development`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #0E3A5D; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Smart Civic Connect</h1>
              <p style="color: #D9A736; margin: 4px 0 0 0; font-size: 12px; font-weight: bold;">Municipal Administration & Urban Development</p>
            </div>
            <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Email Verification Code</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Namaste <strong>${name || 'Citizen'}</strong>,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Thank you for registering on the <strong>Smart Civic Connect</strong> citizen grievance portal. Please use the following 6-digit verification code to complete your registration:</p>
            <div style="text-align: center; margin: 28px 0;">
              <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #0E3A5D; color: #0E3A5D; padding: 16px 36px; border-radius: 12px; font-weight: 800; font-size: 32px; letter-spacing: 8px; font-family: monospace;">
                ${rawOtp}
              </div>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">This code is valid for <strong>10 minutes</strong> and can only be used once.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; margin-bottom: 0;">If you did not request this registration verification code, you can safely ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        console.error(`[Email Service] Failed to send email via Resend API:`, error);
        throw new BadRequestException(`Failed to dispatch verification email: ${error.message}`);
      }

      console.log(`[Email Service] Registration verification OTP dispatched to ${cleanEmail}`);
    } catch (err: any) {
      console.error(`[Email Service] Failed to send email via Resend:`, err);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(`Failed to dispatch verification email: ${err.message}`);
    }

    return {
      success: true,
      message: `Verification code has been sent to ${cleanEmail}. Please enter the 6-digit code.`,
      normalizedPhone,
    };
  }

  /**
   * Verify Real Email OTP and generate cryptographically signed proof
   */
  @Post('verify-email-otp')
  async verifyEmailOtp(@Body() body: { email: string; otp: string }) {
    const { email, otp } = body;
    if (!email || !otp) {
      throw new BadRequestException('Email address and 6-digit verification code are required.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      throw new BadRequestException('Verification code must be exactly 6 digits.');
    }

    const record = await this.db.otpVerification.findFirst({
      where: {
        email: cleanEmail,
        purpose: 'REGISTER',
        verified: false,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      throw new BadRequestException('No active verification code found for this email. Please request a new OTP.');
    }

    // Check expiration
    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Verification code has expired. Please request a new OTP.');
    }

    // Check maximum attempts (max 5)
    if (record.attempts >= 5) {
      throw new BadRequestException('Too many failed attempts. This code is invalidated. Please request a new OTP.');
    }

    const isValid = await bcrypt.compare(cleanOtp, record.otp);
    if (!isValid) {
      await this.db.otpVerification.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 }
      });
      const remaining = 4 - record.attempts;
      throw new BadRequestException(
        remaining > 0
          ? `Invalid verification code. ${remaining} attempt(s) remaining.`
          : 'Invalid verification code. Maximum attempts reached. Please request a new OTP.'
      );
    }

    // Mark verified
    await this.db.otpVerification.update({
      where: { id: record.id },
      data: { verified: true }
    });

    // Generate cryptographically signed verification token (15 mins validity)
    const verificationToken = jwt.sign({
      email: cleanEmail,
      phone: record.phone,
      purpose: 'EMAIL_VERIFIED',
    }, JWT_SECRET, { expiresIn: '15m' });

    return {
      success: true,
      message: 'Email address verified successfully.',
      verificationToken,
      email: cleanEmail,
      phone: record.phone,
    };
  }

  /**
   * Citizen Registration with Required Email Verification Token
   */
  @Post('register')
  async register(@Body() body: {
    email: string;
    name: string;
    phone: string;
    password: string;
    verificationToken?: string;
  }) {
    const { email, name, phone, password, verificationToken } = body;

    if (!email || !name || !password || !phone) {
      throw new BadRequestException('Full name, mobile number, email address, and password are required.');
    }

    if (!verificationToken) {
      throw new UnauthorizedException('Email verification required. Please verify your email with OTP first.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify verificationToken
    let tokenPayload: any;
    try {
      tokenPayload = jwt.verify(verificationToken, JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired email verification token. Please verify your email again.');
    }

    if (tokenPayload.purpose !== 'EMAIL_VERIFIED' || tokenPayload.email !== cleanEmail) {
      throw new UnauthorizedException('Email verification token mismatch. Please verify your email again.');
    }

    // Indian mobile number validation
    const phoneValidation = validateAndNormalizeIndianPhone(phone);
    if (!phoneValidation.isValid) {
      throw new BadRequestException(phoneValidation.error);
    }
    const cleanPhone = phoneValidation.normalized!;

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const existingEmail = await this.db.user.findUnique({ where: { email: cleanEmail } });
    if (existingEmail) {
      throw new BadRequestException('An account with this email address already exists.');
    }

    const existingPhone = await this.db.user.findFirst({ where: { phone: cleanPhone } });
    if (existingPhone) {
      throw new BadRequestException('This mobile number is already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.db.user.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        phone: cleanPhone,
        password: hashedPassword,
        role: 'CITIZEN',
        emailVerified: true,
        emailVerifiedAt: new Date(),
      }
    });

    // Cleanup used OTP records for this email
    await this.db.otpVerification.deleteMany({
      where: { email: cleanEmail, purpose: 'REGISTER' }
    });

    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      role: 'CITIZEN', 
      name: user.name 
    }, JWT_SECRET, { expiresIn: '7d' });

    return {
      message: 'Citizen account registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Request Password Reset Link (Forgot Password)
   * Generates secure 15-min token, stores in DB, sends real email via SMTP
   */
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;

    if (!email || email.trim() === '') {
      throw new BadRequestException('Email address is required.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check Resend Email API configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = 'Smart Civic Connect <onboarding@resend.dev>';

    const isEmailConfigured = Boolean(resendApiKey && resendApiKey.trim() !== '');

    if (!isEmailConfigured) {
      throw new BadRequestException(
        'Email service is not configured on the server. Real password reset delivery requires setting RESEND_API_KEY in backend environment.'
      );
    }

    // Check user in database
    const user = await this.db.user.findUnique({
      where: { email: cleanEmail }
    });

    if (user) {
      // Generate cryptographically secure random reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

      // Delete prior unused tokens for this email
      await this.db.passwordResetToken.deleteMany({
        where: { email: cleanEmail }
      });

      // Save token in database
      await this.db.passwordResetToken.create({
        data: {
          email: cleanEmail,
          token: resetToken,
          expiresAt,
          used: false,
        }
      });

      const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(cleanEmail)}`;

      try {
        const resend = new Resend(resendApiKey.trim());
        const { data, error } = await resend.emails.send({
          from: emailFrom.trim(),
          to: cleanEmail,
          subject: 'Password Reset Request - Smart Civic Connect',
          text: `Namaste ${user.name},\n\nA password reset request was received for your Smart Civic Connect account.\n\nPlease use the following link to reset your password:\n${resetLink}\n\nThis link is valid for 15 minutes and can only be used once.\n\nIf you did not request this, please ignore this email.\n\nSmart Civic Connect\nMunicipal Administration & Urban Development`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="background-color: #002B49; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Smart Civic Connect</h1>
                <p style="color: #D4AF37; margin: 4px 0 0 0; font-size: 12px;">Municipal Administration & Urban Development</p>
              </div>
              <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.6;">Namaste <strong>${user.name}</strong>,</p>
              <p style="color: #334155; font-size: 14px; line-height: 1.6;">A request was made to reset the password for your citizen account associated with <strong>${cleanEmail}</strong>.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetLink}" style="background-color: #002B49; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5;">Or copy and paste this link into your browser:<br/><a href="${resetLink}" style="color: #002B49; word-break: break-all;">${resetLink}</a></p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #94a3b8; font-size: 11px; margin-bottom: 0;">This password reset link will expire in 15 minutes and can only be used once. If you did not request this, you can safely ignore this email.</p>
            </div>
          `,
        });

        if (error) {
          console.error(`[Email Service] Failed to send password reset email via Resend API:`, error);
          throw new BadRequestException(`Failed to dispatch password reset email: ${error.message}`);
        }

        console.log(`[Email Service] Password reset email sent successfully to ${cleanEmail}`);
      } catch (err: any) {
        console.error(`[Email Service] Failed to send password reset email via Resend:`, err);
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException(`Failed to dispatch password reset email: ${err.message}`);
      }
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been dispatched to your inbox. The link is valid for 15 minutes.'
    };
  }

  /**
   * Reset Password with Verified Single-Use Token
   */
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; token: string; newPassword: string }) {
    const { email, token, newPassword } = body;

    if (!email || !token || !newPassword) {
      throw new BadRequestException('Email address, reset token, and new password are required.');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if token already used
    const usedRecord = await this.db.passwordResetToken.findFirst({
      where: {
        email: cleanEmail,
        token: token.trim(),
        used: true,
      }
    });

    if (usedRecord) {
      throw new BadRequestException('This password reset link has already been used. Please request a new password reset.');
    }

    // Verify token from database
    const resetRecord = await this.db.passwordResetToken.findFirst({
      where: {
        email: cleanEmail,
        token: token.trim(),
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset link. Please request a new password reset.');
    }

    const user = await this.db.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      throw new BadRequestException('Account associated with this reset link was not found.');
    }

    // Mark reset token as used (single-use enforcement)
    await this.db.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true }
    });

    // Hash new password securely with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await this.db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    return {
      success: true,
      message: 'Password has been successfully updated. You can now log in with your new password.'
    };
  }
}
