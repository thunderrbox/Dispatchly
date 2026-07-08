import prisma from '../../lib/prisma';
import { CreateZoneSchema, CreateAreaSchema } from './zone.validation';

/**
 * Registers a new regional shipping Zone in the database.
 * Throws an error if the Zone name is already taken.
 */
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

/**
 * Returns a list of all regional Zones along with their nested Area sub-localities.
 */
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

/**
 * Registers a new Area sub-locality under a specific regional Zone.
 * Throws an error if the parent Zone is missing, or if the Area name is already registered.
 */
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

/**
 * Evaluates regional pickup and drop Zone IDs to identify shipping coverage classification.
 * Returns 'INTRA_ZONE' if pickup and drop locations are located in the same parent Zone;
 * otherwise returns 'INTER_ZONE'.
 */
export function detectZoneType(pickupZoneId: string, dropZoneId: string): 'INTRA_ZONE' | 'INTER_ZONE' {
  if (!pickupZoneId || !dropZoneId) {
    throw new Error('Pickup and Drop Zone IDs are required for zone type detection');
  }
  return pickupZoneId === dropZoneId ? 'INTRA_ZONE' : 'INTER_ZONE';
}
