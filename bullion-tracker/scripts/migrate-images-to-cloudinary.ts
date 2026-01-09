#!/usr/bin/env npx tsx
/**
 * Migration Script: Base64 Images to Cloudinary
 *
 * Migrates existing base64-encoded images in the database to Cloudinary cloud storage.
 * Run with: npx tsx scripts/migrate-images-to-cloudinary.ts
 *
 * Options:
 *   --dry-run    Preview changes without modifying database
 *   --batch=N    Process N images at a time (default: 10)
 *   --delay=N    Delay N ms between batches (default: 1000)
 *   --help       Show help
 *
 * Required environment variables:
 *   DATABASE_URL
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 */

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const HELP = args.includes('--help');
const BATCH_SIZE = parseInt(args.find((a) => a.startsWith('--batch='))?.split('=')[1] || '10');
const DELAY_MS = parseInt(args.find((a) => a.startsWith('--delay='))?.split('=')[1] || '1000');

function showHelp() {
  console.log(`
Migration Script: Base64 Images to Cloudinary

Usage: npx tsx scripts/migrate-images-to-cloudinary.ts [options]

Options:
  --dry-run    Preview changes without modifying database
  --batch=N    Process N images at a time (default: 10)
  --delay=N    Delay N ms between batches (default: 1000)
  --help       Show this help message

Required environment variables:
  DATABASE_URL                          Database connection string
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME     Your Cloudinary cloud name
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  Unsigned upload preset name

Example:
  # Dry run to preview
  npx tsx scripts/migrate-images-to-cloudinary.ts --dry-run

  # Run migration with smaller batches
  npx tsx scripts/migrate-images-to-cloudinary.ts --batch=5 --delay=2000
`);
}

// Handle --help immediately (no DB connection needed)
if (HELP) {
  showHelp();
  process.exit(0);
}

// Now import Prisma (requires DATABASE_URL)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cloudinary config
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(
  base64Data: string
): Promise<{ url: string; publicId: string } | null> {
  try {
    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('upload_preset', UPLOAD_PRESET!);
    formData.append('folder', 'bullion-tracker');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  Cloudinary error: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('  Upload error:', error);
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Migration: Base64 Images to Cloudinary');
  console.log('='.repeat(60));

  // Validate configuration
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.error('\nError: Cloudinary not configured!');
    console.error('Set these environment variables:');
    console.error('  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
    console.error('  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
    process.exit(1);
  }

  console.log(`\nConfiguration:`);
  console.log(`  Cloud name: ${CLOUD_NAME}`);
  console.log(`  Upload preset: ${UPLOAD_PRESET}`);
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Delay between batches: ${DELAY_MS}ms`);
  console.log(`  Dry run: ${DRY_RUN ? 'YES (no changes will be made)' : 'NO'}`);

  // Find all base64 images
  console.log('\nFinding base64 images...');
  const images = await prisma.image.findMany({
    where: {
      url: {
        startsWith: 'data:image',
      },
    },
    select: {
      id: true,
      url: true,
      itemId: true,
    },
  });

  if (images.length === 0) {
    console.log('\nNo base64 images found. Nothing to migrate.');
    await prisma.$disconnect();
    return;
  }

  console.log(`\nFound ${images.length} base64 images to migrate.`);

  // Process in batches
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(images.length / BATCH_SIZE);

    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} images)`);

    for (const image of batch) {
      const truncatedId = image.id.substring(0, 8);
      const urlPreview = image.url.substring(0, 30) + '...';

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would migrate: ${truncatedId} (${urlPreview})`);
        skippedCount++;
        continue;
      }

      console.log(`  Uploading: ${truncatedId}...`);

      const result = await uploadToCloudinary(image.url);

      if (result) {
        await prisma.image.update({
          where: { id: image.id },
          data: { url: result.url },
        });
        console.log(`  Success: ${truncatedId} -> ${result.url.substring(0, 50)}...`);
        successCount++;
      } else {
        console.log(`  Failed: ${truncatedId}`);
        failCount++;
      }
    }

    // Delay between batches (except last batch)
    if (i + BATCH_SIZE < images.length) {
      console.log(`  Waiting ${DELAY_MS}ms before next batch...`);
      await sleep(DELAY_MS);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Migration Complete');
  console.log('='.repeat(60));
  console.log(`  Total images: ${images.length}`);

  if (DRY_RUN) {
    console.log(`  Would migrate: ${skippedCount}`);
    console.log('\n  Run without --dry-run to perform migration.');
  } else {
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${failCount}`);

    if (failCount > 0) {
      console.log('\n  Some images failed to migrate. Run again to retry failed images.');
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
