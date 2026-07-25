import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login, googleAuth } from '../auth.service';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';

vi.mock('../../../lib/prisma', () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      deliveryAgent: {
        create: vi.fn(),
      },
      $transaction: vi.fn((cb) => cb({
        user: {
          create: vi.fn().mockImplementation((args) => Promise.resolve({
            id: 'mock-user-id',
            createdAt: new Date(),
            ...args.data,
          })),
        },
        deliveryAgent: {
          create: vi.fn().mockResolvedValue({ id: 'mock-agent-id' }),
        },
      })),
    },
  };
});

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testUser = {
    name: 'Test Auth User',
    username: 'testuser99',
    email: 'testuser@example.com',
    password: 'Password123!',
    role: 'CUSTOMER' as const,
  };

  it('should successfully register a customer user with a username', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const result = await register(testUser);

    expect(result.user).toBeDefined();
    expect(result.user.name).toBe(testUser.name);
    expect(result.user.username).toBe(testUser.username);
    expect(result.user.email).toBe(testUser.email.toLowerCase());
    expect(result.user.role).toBe('CUSTOMER');
    expect(result.token).toBeDefined();
  });

  it('should reject registration if email is already taken', async () => {
    (prisma.user.findUnique as any).mockImplementation(({ where }: any) => {
      if (where.email) return Promise.resolve({ id: 'existing-id', email: where.email });
      return Promise.resolve(null);
    });

    await expect(register(testUser)).rejects.toThrow('User already exists with this email address');
  });

  it('should reject registration if username is already taken', async () => {
    (prisma.user.findUnique as any).mockImplementation(({ where }: any) => {
      if (where.username) return Promise.resolve({ id: 'existing-id', username: where.username });
      return Promise.resolve(null);
    });

    await expect(register(testUser)).rejects.toThrow('Username is already taken. Please choose another username.');
  });

  it('should allow user login via email or username', async () => {
    const hashedPass = await bcrypt.hash(testUser.password, 10);
    const mockUserRecord = {
      id: 'user-123',
      name: testUser.name,
      username: testUser.username,
      email: testUser.email,
      passwordHash: hashedPass,
      role: 'CUSTOMER',
      createdAt: new Date(),
      agentProfile: null,
    };

    (prisma.user.findFirst as any).mockResolvedValue(mockUserRecord);

    const loginResultEmail = await login({
      identifier: testUser.email,
      password: testUser.password,
    });

    expect(loginResultEmail.user).toBeDefined();
    expect(loginResultEmail.user.username).toBe(testUser.username);
    expect(loginResultEmail.token).toBeDefined();

    const loginResultUsername = await login({
      identifier: testUser.username,
      password: testUser.password,
    });

    expect(loginResultUsername.user).toBeDefined();
    expect(loginResultUsername.user.email).toBe(testUser.email.toLowerCase());
    expect(loginResultUsername.token).toBeDefined();
  });

  it('should reject Admin registration without a valid admin secret key', async () => {
    const adminUser = {
      name: 'Hacker Admin',
      username: 'hacker_admin',
      email: 'hacker@example.com',
      password: 'Password123!',
      role: 'ADMIN' as const,
    };

    await expect(register(adminUser)).rejects.toThrow('Invalid Admin Security Passcode');
  });

  it('should allow Admin registration with valid admin secret key', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const validAdmin = {
      name: 'Valid Admin User',
      username: 'valid_admin',
      email: 'valid_admin@example.com',
      password: 'Password123!',
      role: 'ADMIN' as const,
      adminSecretKey: 'DISPATCHLY_ADMIN_SECRET_2026',
    };

    const result = await register(validAdmin);
    expect(result.user).toBeDefined();
    expect(result.user.role).toBe('ADMIN');
  });

  it('should authenticate new Customer user with Google auth', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const googleUserEmail = 'google_user@example.com';
    const result = await googleAuth({
      email: googleUserEmail,
      name: 'Google User',
      role: 'CUSTOMER',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(googleUserEmail);
    expect(result.user.role).toBe('CUSTOMER');
    expect(result.user.username).toBeDefined();
    expect(result.token).toBeDefined();
  });

  it('should authenticate existing user with Google auth seamlessly', async () => {
    const existingGoogleUser = {
      id: 'google-user-id-123',
      name: 'Existing Google User',
      username: 'existing_google',
      email: 'existing_google@example.com',
      role: 'CUSTOMER',
      createdAt: new Date(),
      agentProfile: null,
    };

    (prisma.user.findUnique as any).mockResolvedValue(existingGoogleUser);

    const result = await googleAuth({
      email: existingGoogleUser.email,
      name: existingGoogleUser.name,
      role: 'CUSTOMER',
    });

    expect(result.user.id).toBe(existingGoogleUser.id);
    expect(result.user.email).toBe(existingGoogleUser.email);
    expect(result.token).toBeDefined();
  });

  it('should register new Agent via Google auth and provision DeliveryAgent record', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const agentEmail = 'new_agent@example.com';
    const result = await googleAuth({
      email: agentEmail,
      name: 'New Agent',
      role: 'AGENT',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(agentEmail);
    expect(result.user.role).toBe('AGENT');
    expect(result.token).toBeDefined();
  });

  it('should reject Google auth for Admin role if admin secret key is invalid', async () => {
    await expect(
      googleAuth({
        email: 'fake_admin@example.com',
        name: 'Fake Admin',
        role: 'ADMIN',
        adminSecretKey: 'WRONG_SECRET',
      })
    ).rejects.toThrow('Invalid Admin Security Passcode');
  });

  it('should allow Google auth for Admin role if admin secret key is valid', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const result = await googleAuth({
      email: 'admin_google@example.com',
      name: 'Google Admin',
      role: 'ADMIN',
      adminSecretKey: 'DISPATCHLY_ADMIN_SECRET_2026',
    });

    expect(result.user).toBeDefined();
    expect(result.user.role).toBe('ADMIN');
    expect(result.token).toBeDefined();
  });
});
