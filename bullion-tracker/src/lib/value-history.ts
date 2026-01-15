import 'server-only';
import { prisma } from '@/lib/db';

/**
 * Record a value history entry for an item
 * Upserts entry for today's date (one entry per day per item)
 */
export async function recordValueHistory(
  itemId: string,
  value: number,
  valueType: string,
  source: string | null
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.itemValueHistory.upsert({
    where: {
      collectionItemId_priceDate: {
        collectionItemId: itemId,
        priceDate: today,
      },
    },
    update: {
      value,
      valueType,
      source,
    },
    create: {
      collectionItemId: itemId,
      value,
      valueType,
      priceDate: today,
      source,
    },
  });
}
