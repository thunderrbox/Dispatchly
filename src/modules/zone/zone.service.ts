import prisma from '../../lib/prisma';
import { CreateZoneSchema, CreateAreaSchema } from './zone.validation';

export async function createZone(name: string) {
  const parsed = CreateZoneSchema.parse({ name });
  
  const existing = await prisma.zone.findUnique({
    where: { name: parsed.name },
  });
  if (existing) {
    throw new Error('Zone with this name already exists');
  }

  return await prisma.zone.create({
    data: { name: parsed.name },
  });
}

export async function listZones() {
  return await prisma.zone.findMany({
    include: {
      areas: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function addAreaToZone(zoneId: string, areaName: string) {
  const parsed = CreateAreaSchema.parse({ name: areaName });

  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
  });
  if (!zone) {
    throw new Error('Zone not found');
  }

  const existingArea = await prisma.area.findUnique({
    where: { name: parsed.name },
  });
  if (existingArea) {
    throw new Error('Area with this name already exists in the system');
  }

  return await prisma.area.create({
    data: {
      name: parsed.name,
      zoneId,
    },
  });
}

export function detectZoneType(pickupZoneId: string, dropZoneId: string): 'INTRA_ZONE' | 'INTER_ZONE' {
  if (!pickupZoneId || !dropZoneId) {
    throw new Error('Pickup and Drop Zone IDs are required for zone type detection');
  }
  return pickupZoneId === dropZoneId ? 'INTRA_ZONE' : 'INTER_ZONE';
}
