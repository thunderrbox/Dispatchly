import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { signToken } from '../../lib/jwt';
import { RegisterSchema, LoginSchema } from './auth.validation';
import { sendWelcomeEmail, sendLoginNotificationEmail, sendAdminAlertEmail } from '../notification/notification.service';
import { z } from 'zod';

type RegisterInput = z.infer<typeof RegisterSchema>;
type LoginInput = z.infer<typeof LoginSchema>;

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'DISPATCHLY_ADMIN_SECRET_2026';

export async function register(input: RegisterInput) {
  const parsed = RegisterSchema.parse(input);

  // Security Check: Enforce security verification code for ADMIN role
  if (parsed.role === 'ADMIN') {
    if (!parsed.adminSecretKey || parsed.adminSecretKey !== ADMIN_SECRET_KEY) {
      throw new Error('Invalid Admin Security Passcode. You are not authorized to create an Admin account.');
    }
  }

  // Check if user exists by email or username
  const existingEmail = await prisma.user.findUnique({
    where: { email: parsed.email.toLowerCase() },
  });
  if (existingEmail) {
    throw new Error('User already exists with this email address');
  }

  let existingUsername = null;
  try {
    existingUsername = await prisma.user.findUnique({
      where: { username: parsed.username },
    });
  } catch (e) {
    // If database column User.username is being migrated, ignore
  }

  if (existingUsername) {
    throw new Error('Username is already taken. Please choose another username.');
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  // Transaction to create User and optional DeliveryAgent profile
  const result = await prisma.$transaction(async (tx) => {
    let user;
    try {
      user = await tx.user.create({
        data: {
          name: parsed.name,
          username: parsed.username,
          email: parsed.email.toLowerCase(),
          passwordHash,
          role: parsed.role,
        },
      });
    } catch (e) {
      // Fallback if username column not yet in DB
      user = await tx.user.create({
        data: {
          name: parsed.name,
          email: parsed.email.toLowerCase(),
          passwordHash,
          role: parsed.role,
        } as any,
      });
    }

    if (parsed.role === 'AGENT') {
      await tx.deliveryAgent.create({
        data: {
          userId: user.id,
          currentLatitude: 0.0,
          currentLongitude: 0.0,
          available: true,
        },
      });
    }

    return user;
  });

  // Send automated welcome & account creation email directly to user's inbox + main admin alert
  sendWelcomeEmail(result.email, result.name, result.username || result.name, result.role);
  sendAdminAlertEmail('REGISTER', result.email, result.name, result.role);

  const token = signToken({ userId: result.id, username: result.username || '', role: result.role });

  return {
    user: {
      id: result.id,
      name: result.name,
      username: result.username || result.name,
      email: result.email,
      role: result.role,
      createdAt: result.createdAt,
    },
    token,
  };
}

export async function login(input: LoginInput) {
  const parsed = LoginSchema.parse(input);
  const identifier = (parsed.identifier || parsed.email || '').trim();

  if (!identifier) {
    throw new Error('Email or username is required');
  }

  // Find user by either email or username with fallback
  let user = null;
  try {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
      include: {
        agentProfile: true,
      },
    });
  } catch (e) {
    user = await prisma.user.findFirst({
      where: {
        email: identifier.toLowerCase(),
      },
      include: {
        agentProfile: true,
      },
    });
  }

  if (!user) {
    throw new Error('Account does not exist. Please register first.');
  }

  const isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid password. Please check your credentials.');
  }

  // Send automated login notification email to user + main admin audit alert
  sendLoginNotificationEmail(user.email, user.name, user.role);
  sendAdminAlertEmail('LOGIN', user.email, user.name, user.role);

  const token = signToken({ userId: user.id, username: user.username || '', role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username || user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      agentProfileId: user.agentProfile?.id || null,
    },
    token,
  };
}

export interface GoogleAuthInput {
  email: string;
  name: string;
  googleId?: string;
  role?: 'CUSTOMER' | 'AGENT' | 'ADMIN';
  adminSecretKey?: string;
  isLogin?: boolean;
}

export async function googleAuth(input: GoogleAuthInput) {
  const { email, name, role = 'CUSTOMER', adminSecretKey, isLogin } = input;

  const cleanEmail = email.toLowerCase().trim();

  // Check if user already exists by email
  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { agentProfile: true },
  });

  if (role === 'ADMIN') {
    const expectedSecret = process.env.ADMIN_SECRET_KEY || 'DISPATCHLY_ADMIN_SECRET_2026';
    const isExistingAdmin = user && user.role === 'ADMIN';

    if (!isExistingAdmin) {
      if (!adminSecretKey || adminSecretKey.trim() !== expectedSecret.trim()) {
        throw new Error('Invalid Admin Security Passcode. You are not authorized to log in or register as Admin.');
      }
    }
  }

  if (!user) {
    // Generate unique username from email prefix or name
    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user';
    let uniqueUsername = baseUsername;
    let counter = 1;

    while (true) {
      try {
        const check = await prisma.user.findUnique({ where: { username: uniqueUsername } });
        if (!check) break;
      } catch (e) {
        break;
      }
      uniqueUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const randomPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    user = await prisma.$transaction(async (tx) => {
      let createdUser;
      try {
        createdUser = await tx.user.create({
          data: {
            name: name || baseUsername,
            username: uniqueUsername,
            email: cleanEmail,
            passwordHash,
            role,
          },
        });
      } catch (e) {
        createdUser = await tx.user.create({
          data: {
            name: name || baseUsername,
            email: cleanEmail,
            passwordHash,
            role,
          } as any,
        });
      }

      if (role === 'AGENT') {
        await tx.deliveryAgent.create({
          data: {
            userId: createdUser.id,
            currentLatitude: 0.0,
            currentLongitude: 0.0,
            available: true,
          },
        });
      }

      return createdUser;
    }) as any;

    // Send automated welcome & account creation email directly to user's inbox + main admin alert
    sendWelcomeEmail(user!.email, user!.name, user!.username || user!.name, user!.role);
    sendAdminAlertEmail('REGISTER', user!.email, user!.name, user!.role);
  } else {
    if (!isLogin && user.role !== role) {
      // Update existing user's role to the explicitly selected role during registration
      user = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: user!.id },
          data: { role },
        });

        if (role === 'AGENT' && !user!.agentProfile) {
          await tx.deliveryAgent.create({
            data: {
              userId: updated.id,
              currentLatitude: 0.0,
              currentLongitude: 0.0,
              available: true,
            },
          });
        }

        return tx.user.findUnique({
          where: { id: updated.id },
          include: { agentProfile: true },
        }) as any;
      });
    }

    // Send automated login security notification email to user + main admin audit alert
    sendLoginNotificationEmail(user!.email, user!.name, user!.role);
    sendAdminAlertEmail('LOGIN', user!.email, user!.name, user!.role);
  }

  const token = signToken({ userId: user!.id, username: user!.username || '', role: user!.role });

  return {
    user: {
      id: user!.id,
      name: user!.name,
      username: user!.username,
      email: user!.email,
      role: user!.role,
      createdAt: user!.createdAt,
      agentProfileId: user!.agentProfile?.id || null,
    },
    token,
  };
}
