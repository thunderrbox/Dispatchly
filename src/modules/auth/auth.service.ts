import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { signToken } from '../../lib/jwt';
import { RegisterSchema, LoginSchema } from './auth.validation';
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

  const existingUsername = await prisma.user.findUnique({
    where: { username: parsed.username },
  });
  if (existingUsername) {
    throw new Error('Username is already taken. Please choose another username.');
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  // Transaction to create User and optional DeliveryAgent profile
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.name,
        username: parsed.username,
        email: parsed.email.toLowerCase(),
        passwordHash,
        role: parsed.role,
      },
    });

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

  const token = signToken({ userId: result.id, username: result.username, role: result.role });

  return {
    user: {
      id: result.id,
      name: result.name,
      username: result.username,
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

  // Find user by either email or username
  const user = await prisma.user.findFirst({
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

  if (!user) {
    throw new Error('Invalid email/username or password');
  }

  const isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email/username or password');
  }

  const token = signToken({ userId: user.id, username: user.username, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
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
}

export async function googleAuth(input: GoogleAuthInput) {
  const { email, name, role = 'CUSTOMER', adminSecretKey } = input;

  if (!email) {
    throw new Error('Google authentication failed: Email not provided');
  }

  const cleanEmail = email.toLowerCase();

  // If role specified is ADMIN, verify passcode
  if (role === 'ADMIN') {
    if (!adminSecretKey || adminSecretKey !== ADMIN_SECRET_KEY) {
      throw new Error('Invalid Admin Security Passcode. You are not authorized to create an Admin account.');
    }
  }

  // Check if user already exists by email
  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: { agentProfile: true },
  });

  if (!user) {
    // Generate unique username from email prefix or name
    let baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;
    let uniqueUsername = baseUsername;
    let counter = 1;

    while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
      uniqueUsername = `${baseUsername}_${counter}`;
      counter++;
    }

    const randomPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: name || baseUsername,
          username: uniqueUsername,
          email: cleanEmail,
          passwordHash,
          role,
        },
      });

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
  }

  const token = signToken({ userId: user!.id, username: user!.username, role: user!.role });

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
