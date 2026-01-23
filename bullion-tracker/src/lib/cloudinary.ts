/**
 * Cloudinary Upload Utility
 *
 * Handles image uploads to Cloudinary using unsigned upload preset.
 * Falls back to base64 if Cloudinary is not configured.
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}

/**
 * Upload a base64 image to Cloudinary
 *
 * @param base64Data - Base64 encoded image data (data:image/...;base64,...)
 * @returns Cloudinary URL and public ID, or null if upload fails/not configured
 *
 * @note KNOWN LIMITATION: The returned publicId is not stored in the database.
 * When users delete their accounts, Cloudinary images become orphans.
 * This is an acceptable cost tradeoff - orphaned images are a billing concern,
 * not a security issue (images contain no PII beyond what's visible).
 *
 * @future Future enhancement: Add cleanup job using Cloudinary Admin API to remove
 * images older than X days that aren't referenced in any Image record.
 * Implementation approach:
 * 1. List all images in 'bullion-tracker' folder via Admin API
 * 2. For each publicId, check if any Image.url contains it
 * 3. Delete orphaned images that are older than retention period
 *
 * @see src/app/api/auth/delete-account/route.ts for account deletion flow
 */
export async function uploadToCloudinary(
  base64Data: string
): Promise<{ url: string; publicId: string } | null> {
  if (!isCloudinaryConfigured()) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn(
        'Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in environment.'
      );
    }
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET!);
    formData.append('folder', 'bullion-tracker');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

/**
 * Upload an image, with fallback to base64 if Cloudinary fails
 *
 * @param base64Data - Base64 encoded image data
 * @returns URL (either Cloudinary URL or original base64)
 */
export async function uploadImage(base64Data: string): Promise<string> {
  const cloudinaryResult = await uploadToCloudinary(base64Data);

  if (cloudinaryResult) {
    return cloudinaryResult.url;
  }

  // Fallback to base64
  return base64Data;
}
