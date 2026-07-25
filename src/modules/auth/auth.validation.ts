import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'AGENT', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be CUSTOMER, AGENT, or ADMIN' }),
  }),
  adminSecretKey: z.string().optional(),
});

export const LoginSchema = z.object({
  // Accept identifier (which can be email or username) or fallback email
  identifier: z.string().min(1, 'Email or username is required').optional(),
  email: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.identifier || data.email, {
  message: 'Email or username is required',
  path: ['identifier'],
});
