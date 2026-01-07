'use client';

import React, { useState } from "react";
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { useCollection, usePortfolioHistory } from '@/hooks/useCollection';
import { useCollectionSummary } from '@/hooks/useCollectionSummary';
import { AddItemModal } from '@/components/collection/AddItemModal';
import { CollectionGrid } from '@/components/collection/CollectionGrid';
import { AuthButton } from '@/components/auth/AuthButton';
import { TopPerformers } from '@/components/TopPerformers';
import type { TimeRange } from '@/types';

export default function BullionTrackerWeb() {
  const [valuationMode, setValuationMode] = useState<"spot" | "book">("spot");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "bullion" | "numismatic">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Auth session for user name
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'Your';

  // Fetch real data
  const { data: spotPricesData } = useSpotPrices();
  const { data: portfolioData } = usePortfolioSummary();
  const { data: collectionData } = useCollection();
  const { data: historyData } = usePortfolioHistory(timeRange);
  const { data: collectionSummary } = useCollectionSummary();

  // Process spot prices
  const spotPrices = {
    gold: spotPricesData?.gold.pricePerOz || 0,
    silver: spotPricesData?.silver.pricePerOz || 0,
    platinum: spotPricesData?.platinum.pricePerOz || 0,
  };

  const spotChanges = {
    gold: {
      change: spotPricesData?.gold.change24h || 0,
      changePercent: spotPricesData?.gold.changePercent24h || 0,
    },
    silver: {
      change: spotPricesData?.silver.change24h || 0,
      changePercent: spotPricesData?.silver.changePercent24h || 0,
    },
    platinum: {
      change: spotPricesData?.platinum.change24h || 0,
      changePercent: spotPricesData?.platinum.changePercent24h || 0,
    },
  };

  // Calculate total values
  const totalMeltValue = portfolioData?.totalMeltValue || 0;
  const totalBookValue = portfolioData?.totalBookValue || 0;
  const currentValue = valuationMode === "spot" ? totalMeltValue : totalBookValue;
  const costBasis = totalBookValue;
  const gain = currentValue - costBasis;
  const returnPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;

  // Calculate holdings
  const totalOz = (portfolioData?.goldOz || 0) + (portfolioData?.silverOz || 0) + (portfolioData?.platinumOz || 0);
  const holdings = [
    {
      metal: "Gold",
      oz: (portfolioData?.goldOz || 0).toFixed(2),
      value: (portfolioData?.goldOz || 0) * spotPrices.gold,
      percentage: totalOz > 0 ? Math.round(((portfolioData?.goldOz || 0) / totalOz) * 100) : 0,
      color: "#D4AF37",
    },
    {
      metal: "Silver",
      oz: (portfolioData?.silverOz || 0).toFixed(2),
      value: (portfolioData?.silverOz || 0) * spotPrices.silver,
      percentage: totalOz > 0 ? Math.round(((portfolioData?.silverOz || 0) / totalOz) * 100) : 0,
      color: "#A8A8A8",
    },
    {
      metal: "Platinum",
      oz: (portfolioData?.platinumOz || 0).toFixed(2),
      value: (portfolioData?.platinumOz || 0) * spotPrices.platinum,
      percentage: totalOz > 0 ? Math.round(((portfolioData?.platinumOz || 0) / totalOz) * 100) : 0,
      color: "#E5E4E2",
    },
  ];

  const totalItems = portfolioData?.totalItems || 0;

  // Format chart data for rendering
  const chartPoints = historyData || [];
  const lastUpdated = spotPricesData?.gold.lastUpdated
    ? new Date(spotPricesData.gold.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : "N/A";

  // Get chart value based on category filter
  const getChartValue = (point: typeof chartPoints[0]) => {
    switch (categoryFilter) {
      case "bullion":
        return point.bullionValue || point.meltValue;
      case "numismatic":
        return point.numismaticValue || 0;
      case "all":
      default:
        return point.totalValue || point.meltValue;
    }
  };

  // Calculate min/max for Y-axis (always start at 0)
  const chartValues = chartPoints.map(p => getChartValue(p));
  const chartMin = 0; // Always start at 0
  const chartMax = chartValues.length > 0 ? Math.max(...chartValues) * 1.1 : 100; // Add 10% padding at top
  const chartRange = chartMax - chartMin || 1;

  // Format Y-axis value
  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  };

  // Generate Y-axis ticks (5 evenly spaced from 0 to max)
  const yAxisTicks = [0, 1, 2, 3, 4].map(i => {
    const value = chartMax * (4 - i) / 4;
    return { y: i * 40, value };
  });

  // Get X,Y coordinates for a point
  const getPointCoords = (index: number) => {
    const x = 70 + (index / (chartPoints.length - 1 || 1)) * 910;
    const value = getChartValue(chartPoints[index]);
    const y = 20 + ((chartMax - value) / chartRange) * 180;
    return { x, y, value };
  };

  // Normalize chart data for SVG rendering
  const getChartPath = () => {
    if (chartPoints.length === 0) return "";

    return chartPoints
      .map((point, i) => {
        const { x, y } = getPointCoords(i);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Get category label
  const getCategoryLabel = () => {
    switch (categoryFilter) {
      case "bullion": return "Bullion";
      case "numismatic": return "Numismatic";
      default: return "Portfolio";
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F8F7F4",
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Spot Price Banner */}
      <div style={{
        background: "#1a1a1a",
        padding: "12px 48px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "40px",
      }}>
        <PricePill
          metal="Au"
          price={spotPrices.gold}
          change={spotChanges.gold.change}
          changePercent={spotChanges.gold.changePercent}
          color="#D4AF37"
        />
        <span style={{ color: "#444", fontSize: "8px" }}>•</span>
        <PricePill
          metal="Ag"
          price={spotPrices.silver}
          change={spotChanges.silver.change}
          changePercent={spotChanges.silver.changePercent}
          color="#A8A8A8"
        />
        <span style={{ color: "#444", fontSize: "8px" }}>•</span>
        <PricePill
          metal="Pt"
          price={spotPrices.platinum}
          change={spotChanges.platinum.change}
          changePercent={spotChanges.platinum.changePercent}
          color="#E5E4E2"
        />
        <span style={{
          fontSize: "11px",
          color: "#555",
          marginLeft: "20px",
        }}>
          Updated {lastUpdated}
        </span>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "32px 24px",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
        }}>
          <div>
            <h1 style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#1a1a1a",
              margin: 0,
            }}>
              {firstName}'s Stack
            </h1>
            <p style={{
              fontSize: "14px",
              color: "#666",
              margin: "6px 0 0 0",
            }}>
              {totalItems} {totalItems === 1 ? 'piece' : 'pieces'} · {(portfolioData?.goldOz || 0).toFixed(2)} ozt gold
            </p>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {["Dashboard", "Collection"].map(tab => (
                <TabButton
                  key={tab}
                  label={tab}
                  active={activeTab === tab.toLowerCase()}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  badge={tab === "Collection" ? String(totalItems) : null}
                />
              ))}
              <Link href="/collage">
                <TabButton
                  label="Collage"
                  active={false}
                  onClick={() => {}}
                />
              </Link>
            </div>
            <AuthButton />
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Cards Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              marginBottom: "28px",
            }}>
              {/* Portfolio Value Card */}
              <div style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#888",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    Portfolio Value
                  </span>
                  <div style={{
                    display: "flex",
                    background: "#F5F5F5",
                    borderRadius: "10px",
                    padding: "4px",
                  }}>
                    <ToggleButton
                      label="Spot"
                      active={valuationMode === "spot"}
                      onClick={() => setValuationMode("spot")}
                    />
                    <ToggleButton
                      label="Book"
                      active={valuationMode === "book"}
                      onClick={() => setValuationMode("book")}
                    />
                  </div>
                </div>

                <div style={{
                  fontSize: "44px",
                  fontFamily: "monospace",
                  fontWeight: "600",
                  color: "#1a1a1a",
                  marginBottom: "20px",
                }}>
                  ${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div style={{
                  display: "flex",
                  gap: "32px",
                }}>
                  <MetricItem label="Cost Basis" value={`$${costBasis.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  <MetricItem
                    label="Gain"
                    value={`${gain >= 0 ? "+" : ""}$${gain.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    positive={gain >= 0}
                  />
                  <MetricItem
                    label="Return"
                    value={`${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`}
                    positive={returnPct >= 0}
                  />
                </div>
              </div>

              {/* Category Breakdown Card */}
              <div style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: "20px",
                }}>
                  Category Breakdown
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Bullion Category */}
                  <div style={{
                    padding: "16px",
                    background: "#D4AF3708",
                    borderRadius: "12px",
                    border: "1px solid #D4AF3720",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          background: "#D4AF3715",
                          color: "#D4AF37",
                        }}>BULLION</div>
                        <span style={{ fontSize: "13px", color: "#666" }}>
                          {collectionSummary?.bullionCount || 0} {collectionSummary?.bullionCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <span style={{ fontSize: "18px", fontFamily: "monospace", fontWeight: "600", color: "#1a1a1a" }}>
                        ${(collectionSummary?.bullionValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {/* Bullion metal breakdown */}
                    {collectionSummary?.bullionByMetal && Object.keys(collectionSummary.bullionByMetal).length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px" }}>
                        {Object.entries(collectionSummary.bullionByMetal).slice(0, 2).map(([metal, data]) => (
                          <div key={metal} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ color: "#666", textTransform: "capitalize" }}>
                              {metal} ({data.count})
                            </span>
                            <span style={{ fontFamily: "monospace", color: "#888" }}>
                              ${data.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        {Object.keys(collectionSummary.bullionByMetal).length > 2 && (
                          <div style={{ fontSize: "11px", color: "#999", fontStyle: "italic" }}>
                            +{Object.keys(collectionSummary.bullionByMetal).length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Numismatic Category */}
                  <div style={{
                    padding: "16px",
                    background: "#3B82F608",
                    borderRadius: "12px",
                    border: "1px solid #3B82F620",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          background: "#3B82F615",
                          color: "#3B82F6",
                        }}>NUMISMATIC</div>
                        <span style={{ fontSize: "13px", color: "#666" }}>
                          {collectionSummary?.numismaticCount || 0} {collectionSummary?.numismaticCount === 1 ? 'coin' : 'coins'}
                        </span>
                      </div>
                      <span style={{ fontSize: "18px", fontFamily: "monospace", fontWeight: "600", color: "#1a1a1a" }}>
                        ${(collectionSummary?.numismaticValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {/* Numismatic series breakdown */}
                    {collectionSummary?.numismaticBySeries && Object.keys(collectionSummary.numismaticBySeries).length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "8px" }}>
                        {Object.entries(collectionSummary.numismaticBySeries).slice(0, 2).map(([series, data]) => (
                          <div key={series} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ color: "#666" }}>
                              {series} ({data.count})
                            </span>
                            <span style={{ fontFamily: "monospace", color: "#888" }}>
                              ${data.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                        {Object.keys(collectionSummary.numismaticBySeries).length > 2 && (
                          <div style={{ fontSize: "11px", color: "#999", fontStyle: "italic" }}>
                            +{Object.keys(collectionSummary.numismaticBySeries).length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers Section */}
            <TopPerformers />

            {/* Collection Items Section */}
            <div style={{
              background: "white",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              marginBottom: "28px",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Collection Items
                </span>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    background: "#1a1a1a",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  + Add Piece
                </button>
              </div>

              {/* Items List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {collectionData && collectionData.length > 0 ? (
                  collectionData.slice(0, 5).map((item: any) => {
                    const isExpanded = expandedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        style={{
                          padding: "16px",
                          background: isExpanded ? "white" : "#FAFAFA",
                          borderRadius: "12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          border: isExpanded ? "1px solid #E0E0E0" : "1px solid transparent",
                        }}
                      >
                        {/* Main row */}
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              background: item.category === "NUMISMATIC" ? "#3B82F615" : "#D4AF3715",
                              color: item.category === "NUMISMATIC" ? "#3B82F6" : "#D4AF37",
                            }}>
                              {item.category || "BULLION"}
                            </div>
                            <span style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>
                              {item.title || 'Untitled'}
                            </span>
                            {item.problemType && (
                              <div style={{
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                background: "#FEF2F2",
                                color: "#EF4444",
                              }}>
                                {item.problemType}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "16px", fontFamily: "monospace", fontWeight: "600", color: "#1a1a1a" }}>
                              ${(item.numismaticValue || item.customBookValue || (item.spotPriceAtCreation && item.weightOz ? item.spotPriceAtCreation * item.weightOz * item.quantity : 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: "18px", color: "#888", transition: "transform 0.2s ease", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div style={{
                            marginTop: "16px",
                            paddingTop: "16px",
                            borderTop: "1px solid #F0F0F0",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}>
                            {item.category === "NUMISMATIC" && (
                              <>
                                {item.grade && (
                                  <div>
                                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Grade</div>
                                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>
                                      {item.grade}{item.isGradeEstimated && " (Est.)"}
                                    </div>
                                  </div>
                                )}
                                {item.gradingService && (
                                  <div>
                                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Service</div>
                                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>{item.gradingService}</div>
                                  </div>
                                )}
                                {item.certNumber && (
                                  <div>
                                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Cert #</div>
                                    <div style={{ fontSize: "14px", fontFamily: "monospace", color: "#1a1a1a" }}>{item.certNumber}</div>
                                  </div>
                                )}
                              </>
                            )}
                            {item.category === "BULLION" && (
                              <>
                                {item.metal && (
                                  <div>
                                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Metal</div>
                                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a", textTransform: "capitalize" }}>{item.metal}</div>
                                  </div>
                                )}
                                {item.weightOz && (
                                  <div>
                                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Weight</div>
                                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>{Number(item.weightOz).toFixed(2)} oz</div>
                                  </div>
                                )}
                                {item.quantity && (
                                  <div>
                                    <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Quantity</div>
                                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>{item.quantity}</div>
                                  </div>
                                )}
                              </>
                            )}
                            {item.purchaseDate && (
                              <div>
                                <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Purchase Date</div>
                                <div style={{ fontSize: "14px", fontWeight: "500", color: "#1a1a1a" }}>
                                  {new Date(item.purchaseDate).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                            {item.notes && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Notes</div>
                                <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.5" }}>{item.notes}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                    <p>No items in collection yet</p>
                    <p style={{ fontSize: "13px", marginTop: "8px" }}>Click "+ Add Piece" to get started</p>
                  </div>
                )}
              </div>

              {/* View All Link */}
              {collectionData && collectionData.length > 5 && (
                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button
                    onClick={() => setActiveTab("collection")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#3B82F6",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      margin: "0 auto",
                    }}
                  >
                    View All {collectionData.length} Items →
                  </button>
                </div>
              )}
            </div>

            {/* Chart Section */}
            <div style={{
              background: "white",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              marginBottom: "28px",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Track Collection Value Over Time
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["24H", "1W", "1M", "1Y", "5Y"] as TimeRange[]).map(range => (
                    <TimeRangeButton
                      key={range}
                      label={range}
                      active={timeRange === range}
                      onClick={() => setTimeRange(range)}
                    />
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", color: "#888" }}>Show:</span>
                <div style={{ display: "flex", gap: "4px", background: "#f5f5f5", borderRadius: "8px", padding: "3px" }}>
                  {(["all", "bullion", "numismatic"] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setCategoryFilter(filter)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: "500",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background: categoryFilter === filter ? "white" : "transparent",
                        color: categoryFilter === filter ? "#1a1a1a" : "#666",
                        boxShadow: categoryFilter === filter ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.15s ease",
                        textTransform: "capitalize",
                      }}
                    >
                      {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div style={{
                height: "220px",
                position: "relative",
              }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 1000 220"
                  preserveAspectRatio="xMidYMid meet"
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  {/* Y-axis labels and grid lines */}
                  {yAxisTicks.map((tick, i) => (
                    <g key={i}>
                      <line
                        x1="70"
                        y1={20 + i * 45}
                        x2="980"
                        y2={20 + i * 45}
                        stroke="#f0f0f0"
                        strokeWidth="1"
                      />
                      <text
                        x="65"
                        y={25 + i * 45}
                        textAnchor="end"
                        style={{ fontSize: "12px", fill: "#888" }}
                      >
                        {formatYAxisValue(tick.value)}
                      </text>
                    </g>
                  ))}
                  {/* Value line */}
                  {chartPoints.length > 0 && (
                    <path
                      d={getChartPath()}
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {/* Hover targets - invisible circles for each data point */}
                  {chartPoints.map((point, i) => {
                    const { x, y } = getPointCoords(i);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="15"
                        fill="transparent"
                        style={{ cursor: "crosshair" }}
                        onMouseEnter={() => setHoveredPointIndex(i)}
                      />
                    );
                  })}
                  {/* Highlighted point on hover */}
                  {hoveredPointIndex !== null && chartPoints.length > 0 && (() => {
                    const { x, y } = getPointCoords(hoveredPointIndex);
                    return (
                      <g>
                        {/* Vertical line */}
                        <line
                          x1={x}
                          y1={20}
                          x2={x}
                          y2={200}
                          stroke="#D4AF37"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          opacity="0.5"
                        />
                        {/* Dot */}
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#D4AF37"
                          stroke="white"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })()}
                </svg>

                {/* Tooltip */}
                {hoveredPointIndex !== null && chartPoints.length > 0 && (() => {
                  const point = chartPoints[hoveredPointIndex];
                  const { x, value } = getPointCoords(hoveredPointIndex);
                  const tooltipX = (x / 1000) * 100; // Convert to percentage
                  return (
                    <div style={{
                      position: "absolute",
                      left: `${tooltipX}%`,
                      top: "0",
                      transform: "translateX(-50%)",
                      background: "white",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      pointerEvents: "none",
                      zIndex: 10,
                    }}>
                      <div style={{ fontSize: "11px", color: "#888", marginBottom: "2px" }}>
                        {point.date}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>
                        ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })()}

                {/* Legend */}
                <div style={{
                  display: "flex",
                  gap: "24px",
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "8px",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "20px", height: "3px", background: "#D4AF37", borderRadius: "2px" }} />
                    {getCategoryLabel()} Value
                  </span>
                </div>
              </div>
            </div>

          </>
        )}

        {/* Collection Tab */}
        {activeTab === "collection" && (
          <CollectionGrid onAddItem={() => setIsAddModalOpen(true)} />
        )}
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

// Sub-components

const PricePill = ({ metal, price, change, changePercent, color }: {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
  color: string;
}) => {
  const isPositive = change >= 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span style={{
          fontSize: "13px",
          fontWeight: "600",
          color: color,
        }}>
          {metal}
        </span>
        <span style={{
          fontSize: "14px",
          fontFamily: "monospace",
          color: "white",
        }}>
          ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span style={{ fontSize: "10px", color: "#666" }}>/oz</span>
      </div>
      {changePercent !== 0 && (
        <span style={{
          fontSize: "10px",
          color: isPositive ? "#22A06B" : "#E53935",
          fontWeight: "600",
        }}>
          {isPositive ? "↑" : "↓"} {Math.abs(changePercent).toFixed(2)}%
        </span>
      )}
    </div>
  );
};

const TabButton = ({ label, active, onClick, badge }: {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string | null;
}) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#F0F0F0" : "transparent",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "14px",
      fontWeight: "500",
      color: active ? "#1a1a1a" : "#888",
      cursor: "pointer",
      transition: "all 0.2s ease",
      position: "relative",
    }}
  >
    {label}
    {badge && (
      <span style={{
        position: "absolute",
        top: "2px",
        right: "2px",
        background: "#D4AF37",
        color: "white",
        fontSize: "9px",
        fontWeight: "600",
        padding: "1px 5px",
        borderRadius: "8px",
      }}>
        {badge}
      </span>
    )}
  </button>
);

const ToggleButton = ({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "white" : "transparent",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "13px",
      fontWeight: "500",
      color: active ? "#1a1a1a" : "#888",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
    }}
  >
    {label}
  </button>
);

const MetricItem = ({ label, value, positive }: {
  label: string;
  value: string;
  positive?: boolean;
}) => (
  <div>
    <div style={{
      fontSize: "11px",
      color: "#888",
      textTransform: "uppercase",
      letterSpacing: "0.3px",
      marginBottom: "4px",
    }}>
      {label}
    </div>
    <div style={{
      fontSize: "16px",
      fontFamily: "monospace",
      fontWeight: "500",
      color: positive !== undefined ? (positive ? "#22A06B" : "#E53935") : "#1a1a1a",
    }}>
      {value}
    </div>
  </div>
);

const HoldingRow = ({ metal, oz, value, percentage, color }: {
  metal: string;
  oz: string;
  value: number;
  percentage: number;
  color: string;
}) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #F5F5F5",
  }}>
    <span style={{
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      background: color,
      marginRight: "12px",
      flexShrink: 0,
    }} />
    <span style={{
      flex: 1,
      fontSize: "14px",
      fontWeight: "500",
      color: "#1a1a1a",
    }}>
      {metal}
    </span>
    <span style={{
      fontSize: "13px",
      fontFamily: "monospace",
      color: "#666",
      marginRight: "20px",
      minWidth: "65px",
      textAlign: "right",
    }}>
      {oz} ozt
    </span>
    <span style={{
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#1a1a1a",
      minWidth: "85px",
      textAlign: "right",
      marginRight: "20px",
    }}>
      ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
    <span style={{
      fontSize: "13px",
      fontFamily: "monospace",
      color: percentage > 0 ? "#1a1a1a" : "#ccc",
      minWidth: "40px",
      textAlign: "right",
    }}>
      {percentage}%
    </span>
  </div>
);

const TimeRangeButton = ({ label, active, onClick }: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#1a1a1a" : "transparent",
      border: active ? "none" : "1px solid #E0E0E0",
      borderRadius: "6px",
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: "500",
      color: active ? "white" : "#666",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }}
  >
    {label}
  </button>
);

const ActionButton = ({ label, primary, onClick }: {
  label: string;
  primary?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      background: primary ? "#1a1a1a" : "white",
      color: primary ? "white" : "#1a1a1a",
      border: primary ? "none" : "1px solid #E0E0E0",
      borderRadius: "12px",
      padding: "14px 28px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
  >
    {label}
  </button>
);
