import { z } from 'zod';

export const CreateOrderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID').optional(), // Optional on route, resolved in service
  pickupAddress: z.string().min(5, 'Pickup address must be at least 5 characters'),
  dropAddress: z.string().min(5, 'Drop address must be at least 5 characters'),
  pickupAreaName: z.string().min(2, 'Pickup area is required'),
  dropAreaName: z.string().min(2, 'Drop area is required'),
  actualWeight: z.number().positive('Weight must be greater than zero'),
  lengthCm: z.number().positive('Length must be greater than zero'),
  widthCm: z.number().positive('Width must be greater than zero'),
  heightCm: z.number().positive('Height must be greater than zero'),
  orderType: z.enum(['B2B', 'B2C'], {
    errorMap: () => ({ message: 'orderType must be B2B or B2C' }),
  }),
  paymentType: z.enum(['PREPAID', 'COD'], {
    errorMap: () => ({ message: 'paymentType must be PREPAID or COD' }),
  }),
  transactionId: z.string().optional(),
});
