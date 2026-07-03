import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma';
import { signToken } from '../../lib/jwt';
import { RegisterSchema, LoginSchema } from './auth.validation';
import { z } from 'zod';

type RegisterInput = z.infer<typeof RegisterSchema>;
type LoginInput = z.infer<typeof LoginSchema>;

export async function register(input: RegisterInput) {
  const parsed = RegisterSchema.parse(input);

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.email },
  });

  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);

  // Use a transaction to ensure both user and agent profile are created if role is AGENT
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
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

  const token = signToken({ userId: result.id, role: result.role });

  return {
    user: {
      id: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      createdAt: result.createdAt,
    },
    token,
  };
}

export async function login(input: LoginInput) {
  const parsed = LoginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    include: {
      agentProfile: true,
    },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = signToken({ userId: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      agentProfileId: user.agentProfile?.id || null,
    },
    token,
  };
}
