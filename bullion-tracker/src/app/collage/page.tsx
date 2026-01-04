'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCollection } from '@/hooks/useCollection';
import { AuthButton } from '@/components/auth/AuthButton';
import type { Metal, CollectionItem } from '@/types';

export default function CollagePage() {
  const { data: items, isLoading } = useCollection();
  const [filterMetal, setFilterMetal] = useState<Metal | 'all'>('all');
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Get all images with metadata
  const allImages = items?.flatMap((item: CollectionItem) =>
    (item.images || []).map((url: string) => ({
      url,
      title: item.type === 'itemized' ? (item as any).title : `${item.metal} (Bulk)`,
      metal: item.metal,
      itemId: item.id,
    }))
  ) || [];

  // Filter images by metal
  const filteredImages =
    filterMetal === 'all'
      ? allImages
      : allImages.filter((img: { url: string; title: string; metal: Metal; itemId: string }) => img.metal === filterMetal);

  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#F8F7F4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        <div style={{ fontSize: "16px", color: "#666" }}>Loading collection...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F8F7F4",
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Auth Button - Fixed at top right */}
      <div style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 1000,
      }}>
        <AuthButton />
      </div>

      {/* Header Section */}
      <div style={{
        background: "white",
        borderBottom: "1px solid #E0E0E0",
        padding: "32px 48px",
      }}>
        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}>
            <div>
              <h1 style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#1a1a1a",
                margin: 0,
                marginBottom: "8px",
              }}>
                Collection Collage
              </h1>
              <p style={{
                fontSize: "15px",
                color: "#666",
                margin: 0,
              }}>
                {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} in your collection
              </p>
            </div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button style={{
                background: "white",
                color: "#1a1a1a",
                border: "1px solid #E0E0E0",
                borderRadius: "12px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}>
                ← Back to Dashboard
              </button>
            </Link>
          </div>

          {/* Filters */}
          <div>
            <span style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "inline-block",
              marginRight: "16px",
            }}>
              Filter by Metal
            </span>
            <div style={{
              display: "inline-flex",
              gap: "8px",
              flexWrap: "wrap",
            }}>
              <FilterButton
                label="All"
                active={filterMetal === 'all'}
                onClick={() => setFilterMetal('all')}
              />
              <FilterButton
                label="Gold"
                active={filterMetal === 'gold'}
                onClick={() => setFilterMetal('gold')}
              />
              <FilterButton
                label="Silver"
                active={filterMetal === 'silver'}
                onClick={() => setFilterMetal('silver')}
              />
              <FilterButton
                label="Platinum"
                active={filterMetal === 'platinum'}
                onClick={() => setFilterMetal('platinum')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Collage Grid */}
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "40px 32px",
      }}>
        {filteredImages.length === 0 ? (
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "64px 48px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "18px",
              color: "#666",
              marginBottom: "24px",
            }}>
              No images in your collection yet
            </div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <button style={{
                background: "#1a1a1a",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "14px 28px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}>
                Add Items with Images
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}>
            {filteredImages.map((image: { url: string; title: string; metal: Metal; itemId: string }, index: number) => (
              <div
                key={`${image.itemId}-${index}`}
                onClick={() => setSelectedImage({ url: image.url, title: image.title })}
                style={{
                  cursor: "pointer",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  background: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ position: "relative", paddingBottom: "100%", overflow: "hidden" }}>
                  <img
                    src={image.url}
                    alt={image.title}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div style={{
                  padding: "16px",
                  background: "white",
                }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#1a1a1a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {image.title}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "#888",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginTop: "4px",
                  }}>
                    {image.metal}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0, 0, 0, 0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div style={{
            position: "relative",
            maxWidth: "90vw",
            maxHeight: "90vh",
          }}>
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: "absolute",
                top: "-48px",
                right: "0",
                background: "none",
                border: "none",
                color: "white",
                fontSize: "36px",
                cursor: "pointer",
                padding: "8px 16px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              style={{
                maxWidth: "100%",
                maxHeight: "calc(90vh - 80px)",
                objectFit: "contain",
                borderRadius: "12px",
              }}
            />
            <div style={{
              color: "white",
              textAlign: "center",
              marginTop: "24px",
              fontSize: "18px",
              fontWeight: "500",
            }}>
              {selectedImage.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Filter Button Component
const FilterButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#F0F0F0" : "white",
      border: active ? "none" : "1px solid #E0E0E0",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: "500",
      color: active ? "#1a1a1a" : "#666",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
  >
    {label}
  </button>
);
