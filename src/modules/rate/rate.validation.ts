import { z } from 'zod';

export const CreateRateCardSchema = z.object({
  orderType: z.enum(['B2B', 'B2C'], {
    errorMap: () => ({ message: 'orderType must be B2B or B2C' }),
  }),
  zoneType: z.enum(['INTRA_ZONE', 'INTER_ZONE'], {
    errorMap: () => ({ message: 'zoneType must be INTRA_ZONE or INTER_ZONE' }),
  }),
  pricePerKg: z.number().positive('Price per kg must be positive'),
  codCharge: z.number().min(0, 'COD charge must be 0 or positive').default(0),
  isActive: z.boolean().default(true),
});

export const CalculateRateSchema = z.object({
  actualWeight: z.number().positive('Weight must be greater than zero'),
  lengthCm: z.number().positive('Length must be greater than zero'),
  widthCm: z.number().positive('Width must be greater than zero'),
  heightCm: z.number().positive('Height must be greater than zero'),
  orderType: z.enum(['B2B', 'B2C']),
  pickupZoneId: z.string().uuid('Invalid pickup zone ID'),
  dropZoneId: z.string().uuid('Invalid drop zone ID'),
  paymentType: z.enum(['PREPAID', 'COD']),
});
