import prisma from '../../lib/prisma';
import { CreateRateCardSchema, CalculateRateSchema } from './rate.validation';
import { detectZoneType } from '../zone/zone.service';
import { z } from 'zod';

type CreateRateCardInput = z.infer<typeof CreateRateCardSchema>;
type CalculateRateInput = z.infer<typeof CalculateRateSchema>;

export async function createRateCard(input: CreateRateCardInput) {
  const parsed = CreateRateCardSchema.parse(input);

  // Deactivate any existing rate cards with the same combination or overwrite
  // The specs say unique combination of orderType and zoneType is key.
  // We can upsert or check for duplicate:
  const existing = await prisma.rateCard.findUnique({
    where: {
      orderType_zoneType: {
        orderType: parsed.orderType,
        zoneType: parsed.zoneType,
      },
    },
  });

  if (existing) {
    // If it exists, update it to the new values and ensure it is active
    return await prisma.rateCard.update({
      where: { id: existing.id },
      data: {
        pricePerKg: parsed.pricePerKg,
        codCharge: parsed.codCharge,
        isActive: parsed.isActive,
      },
    });
  }

  return await prisma.rateCard.create({
    data: parsed,
  });
}

export async function listRateCards() {
  return await prisma.rateCard.findMany({
    orderBy: [
      { orderType: 'asc' },
      { zoneType: 'asc' },
    ],
  });
}

// Separate synchronous calculation engine for easy testing
export function calculateRateSync(
  input: Omit<CalculateRateInput, 'pickupZoneId' | 'dropZoneId'> & {
    zoneType: 'INTRA_ZONE' | 'INTER_ZONE';
    rateCard: { pricePerKg: number; codCharge: number; isActive: boolean };
  }
) {
  const { actualWeight, lengthCm, widthCm, heightCm, paymentType, rateCard } = input;

  if (actualWeight <= 0 || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
    throw new Error('Weight and dimensions must be greater than zero');
  }

  if (!rateCard.isActive) {
    throw new Error('Rate card is inactive');
  }

  const volumetricWeight = (lengthCm * widthCm * heightCm) / 5000;
  // Volumetric weight rounded or float? Usually flat floating point.
  // billableWeight is max of actual and volumetric
  const billableWeight = Math.max(actualWeight, volumetricWeight);
  
  const baseAmount = billableWeight * rateCard.pricePerKg;
  const codSurcharge = paymentType === 'COD' ? rateCard.codCharge : 0;
  const finalAmount = baseAmount + codSurcharge;

  return {
    volumetricWeight,
    billableWeight,
    baseAmount,
    codSurcharge,
    finalAmount,
  };
}

export async function calculateRate(input: CalculateRateInput) {
  const parsed = CalculateRateSchema.parse(input);
  const zoneType = detectZoneType(parsed.pickupZoneId, parsed.dropZoneId);

  // Retrieve active rate card
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
