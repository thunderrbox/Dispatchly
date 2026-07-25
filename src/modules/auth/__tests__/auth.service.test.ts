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

  it('should authenticate user with Google auth', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const googleUserEmail = 'google_user@example.com';
    const result = await googleAuth({
      email: googleUserEmail,
      name: 'Google User',
      role: 'CUSTOMER',
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(googleUserEmail);
    expect(result.user.username).toBeDefined();
    expect(result.token).toBeDefined();
  });
});
