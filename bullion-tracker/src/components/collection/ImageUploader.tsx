'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/Button';
import { isValidImage, isValidFileSize } from '@/lib/utils';

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
      setError(null);
      setUploading(true);

      try {
        // Validate files
        for (const file of acceptedFiles) {
          if (!isValidImage(file)) {
            setError('Only JPG, PNG, and WebP images are allowed');
            setUploading(false);
            return;
          }
          if (!isValidFileSize(file)) {
            setError('File size must be less than 10MB');
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
            // Compress image
            const compressed = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });

            // Convert to base64 for temporary storage
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(compressed);
            });

            newImages.push(base64);
          } catch (err) {
            console.error('Error processing image:', err);
            setError('Failed to process image');
          }
        }

        onChange([...images, ...newImages]);
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
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
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
                <p className="text-sm mt-2">JPG, PNG, or WebP (max 10MB per image)</p>
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
        <strong>Note:</strong> Images are stored as base64 temporarily. Configure cloud storage (Cloudinary/S3) in .env for production use.
      </div>
    </div>
  );
}
