'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/Button';
import { uploadImage, isCloudinaryConfigured } from '@/lib/cloudinary';

// Check if file is a valid image type (including HEIC)
function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
  const hasValidType = validTypes.includes(file.type.toLowerCase());
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  return hasValidType || hasValidExtension;
}

// Check file size
function isValidFileSize(file: File, maxSizeMB: number = 20): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      setError(null);
      setUploading(true);

      try {
        // Validate files
        for (const file of acceptedFiles) {
          if (!isValidImageType(file)) {
            setError('Only JPG, PNG, WebP, and HEIC images are allowed');
            setUploading(false);
            return;
          }
          if (!isValidFileSize(file)) {
            setError('File size must be less than 20MB');
            setUploading(false);
            return;
          }
        }

        // Check max images
        if (images.length + acceptedFiles.length > maxImages) {
          setError(`Maximum ${maxImages} images allowed`);
          setUploading(false);
          return;
        }

        // Compress and convert to base64 (temporary until we have cloud storage)
        const newImages: string[] = [];

        for (const file of acceptedFiles) {
          try {
            let processedFile: Blob = file;

            // Convert HEIC/HEIF to JPEG
            const isHeic = file.type.toLowerCase().includes('heic') ||
                          file.type.toLowerCase().includes('heif') ||
                          file.name.toLowerCase().endsWith('.heic') ||
                          file.name.toLowerCase().endsWith('.heif');

            if (isHeic) {
              try {
                // Dynamic import to avoid SSR issues
                const heic2any = (await import('heic2any')).default;
                const convertedBlob = await heic2any({
                  blob: file,
                  toType: 'image/jpeg',
                  quality: 0.8,
                });
                processedFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
              } catch (heicError) {
                console.error('HEIC conversion failed:', heicError);
                setError('Failed to convert HEIC image. Please use JPG or PNG.');
                continue;
              }
            }

            // Compress image with error handling
            let compressed: Blob;
            try {
              compressed = await imageCompression(processedFile as File, {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1280,
                useWebWorker: false,
              });
            } catch (compressionError) {
              console.warn('Compression failed, using converted file:', compressionError);
              compressed = processedFile;
            }

            // Convert to base64 first
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.readAsDataURL(compressed);
            });

            // Upload to Cloudinary (falls back to base64 if not configured)
            const imageUrl = await uploadImage(base64);
            newImages.push(imageUrl);
          } catch (err) {
            console.error('Error processing image:', err);
            setError('Failed to process image');
          }
        }

        if (newImages.length > 0) {
          onChange([...images, ...newImages]);
        }
      } catch (err) {
        console.error('Error uploading images:', err);
        setError('Failed to upload images');
      } finally {
        setUploading(false);
      }
    },
    [images, onChange, maxImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'],
    },
    maxFiles: maxImages - images.length,
    disabled: uploading || images.length >= maxImages,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-text-primary">
        Images {images.length > 0 && `(${images.length}/${maxImages})`}
      </label>

      {/* Existing Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2">
                {index > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => moveImage(index, index - 1)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ←
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeImage(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </Button>
                {index < images.length - 1 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => moveImage(index, index + 1)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    →
                  </Button>
                )}
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-accent-primary text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-accent-primary bg-accent-primary/10'
              : 'border-border hover:border-accent-primary hover:bg-background-secondary'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="text-text-secondary">
            {uploading ? (
              <p>Uploading...</p>
            ) : isDragActive ? (
              <p>Drop images here...</p>
            ) : (
              <>
                <p className="font-medium">Drag and drop images here, or click to select</p>
                <p className="text-sm mt-2">JPG, PNG, WebP, or HEIC (max 20MB per image)</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Note */}
      <div className="text-xs text-text-secondary">
        {isCloudinaryConfigured() ? (
          <><strong>Note:</strong> Images are uploaded to Cloudinary cloud storage.</>
        ) : (
          <><strong>Note:</strong> Images stored as base64. Configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET for cloud storage.</>
        )}
      </div>
    </div>
  );
}
