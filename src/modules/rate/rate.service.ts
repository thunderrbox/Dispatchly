import prisma from '../../lib/prisma';
import { CreateRateCardSchema, CalculateRateSchema } from './rate.validation';
import { detectZoneType } from '../zone/zone.service';
import { z } from 'zod';

type CreateRateCardInput = z.infer<typeof CreateRateCardSchema>;
type CalculateRateInput = z.infer<typeof CalculateRateSchema>;

/**
 * Creates or updates an active pricing rate card.
 * Enforces a unique constraint on the combination of order category (B2B/B2C)
 * and route shipping coverage zone (INTRA_ZONE/INTER_ZONE).
 */
export async function createRateCard(input: CreateRateCardInput) {
  const parsed = CreateRateCardSchema.parse(input);

  // Check if a rate card with this combination already exists
  const existing = await prisma.rateCard.findUnique({
    where: {
      orderType_zoneType: {
        orderType: parsed.orderType,
        zoneType: parsed.zoneType,
      },
    },
  });

  if (existing) {
    // If it exists, update the card with the new rates and set active state
    return await prisma.rateCard.update({
      where: { id: existing.id },
      data: {
        pricePerKg: parsed.pricePerKg,
        codCharge: parsed.codCharge,
        isActive: parsed.isActive,
      },
    });
  }

  // Create a new rate card record if none exists for this type combination
  return await prisma.rateCard.create({
    data: parsed,
  });
}

/**
 * Lists all rate card rules configured in the database, ordered by category.
 */
export async function listRateCards() {
  return await prisma.rateCard.findMany({
    orderBy: [
      { orderType: 'asc' },
      { zoneType: 'asc' },
    ],
  });
}

/**
 * Pure, stateless synchronous calculation engine.
 * Computes volumetric weight and compares it against actual weight to determine the billable weight.
 * Adds flat Cash on Delivery (COD) surcharges if COD payment option is chosen.
 * Isolated from external DB dependencies for deterministic unit testing.
 */
export function calculateRateSync(
  input: Omit<CalculateRateInput, 'pickupZoneId' | 'dropZoneId'> & {
    zoneType: 'INTRA_ZONE' | 'INTER_ZONE';
    rateCard: { pricePerKg: number; codCharge: number; isActive: boolean };
  }
) {
  const { actualWeight, lengthCm, widthCm, heightCm, paymentType, rateCard } = input;

  // 1. Validate package parameters
  if (actualWeight <= 0 || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
    throw new Error('Weight and dimensions must be greater than zero');
  }

  if (!rateCard.isActive) {
    throw new Error('Rate card is inactive');
  }

  // 2. Compute Volumetric Weight: (Length * Width * Height) / 5000
  const volumetricWeight = (lengthCm * widthCm * heightCm) / 5000;

  // 3. Determine Billable Weight (max of actual and volumetric weight)
  const billableWeight = Math.max(actualWeight, volumetricWeight);
  
  // 4. Calculate total base amount by multiplying billable weight with price rate per kg
  const baseAmount = billableWeight * rateCard.pricePerKg;

  // 5. Apply COD surcharge if payment is Cash on Delivery
  const codSurcharge = paymentType === 'COD' ? rateCard.codCharge : 0;
  
  // 6. Compute final invoice amount
  const finalAmount = baseAmount + codSurcharge;

  return {
    volumetricWeight,
    billableWeight,
    baseAmount,
    codSurcharge,
    finalAmount,
  };
}

/**
 * Orchestrates shipping rate calculation workflows.
 * Resolves regional pickup and drop zones to identify coverage zone type (INTRA_ZONE vs INTER_ZONE),
 * fetches the corresponding active rate card, and runs the pricing calculator engine.
 */
export async function calculateRate(input: CalculateRateInput) {
  const parsed = CalculateRateSchema.parse(input);
  
  // Resolve zone type (INTRA_ZONE if same zone, INTER_ZONE if different zones)
  const zoneType = detectZoneType(parsed.pickupZoneId, parsed.dropZoneId);

  // Fetch the configured active rate card rule from database
  const rateCard = await prisma.rateCard.findUnique({
    where: {
      orderType_zoneType: {
        orderType: parsed.orderType,
        zoneType: zoneType,
      },
    },
  });

  if (!rateCard || !rateCard.isActive) {
    throw new Error(
      `No active rate card found for Order Type: ${parsed.orderType} and Zone Type: ${zoneType}`
    );
  }

  // Execute synchronous calculator engine
  const calculation = calculateRateSync({
    actualWeight: parsed.actualWeight,
    lengthCm: parsed.lengthCm,
    widthCm: parsed.widthCm,
    heightCm: parsed.heightCm,
    orderType: parsed.orderType,
    paymentType: parsed.paymentType,
    zoneType,
    rateCard,
  });

  return {
    ...calculation,
    zoneType,
    rateCardId: rateCard.id,
  };
}
