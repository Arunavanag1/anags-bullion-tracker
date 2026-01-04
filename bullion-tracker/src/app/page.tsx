'use client';

import React, { useState } from "react";
import Link from 'next/link';
import { useSpotPrices } from '@/hooks/useSpotPrices';
import { usePortfolioSummary } from '@/hooks/usePortfolioSummary';
import { useCollection, usePortfolioHistory } from '@/hooks/useCollection';
import { useCollectionSummary } from '@/hooks/useCollectionSummary';
import { AddItemModal } from '@/components/collection/AddItemModal';
import { CollectionGrid } from '@/components/collection/CollectionGrid';
import { AuthButton } from '@/components/auth/AuthButton';
import type { TimeRange } from '@/types';

export default function BullionTrackerWeb() {
  const [valuationMode, setValuationMode] = useState<"spot" | "book">("spot");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState<TimeRange>("1M");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

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

  // Normalize chart data for SVG rendering
  const getChartPath = () => {
    if (chartPoints.length === 0) return "";

    const values = chartPoints.map(p => valuationMode === "spot" ? p.meltValue : p.bookValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return chartPoints
      .map((point, i) => {
        const x = (i / (chartPoints.length - 1 || 1)) * 1000;
        const value = valuationMode === "spot" ? point.meltValue : point.bookValue;
        const y = 180 - ((value - min) / range) * 150;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

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
              Bullion Collection Tracker
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
            gap: "8px",
          }}>
            {["Dashboard", "Collection", "Collage"].map(tab => (
              <TabButton
                key={tab}
                label={tab}
                active={activeTab === tab.toLowerCase()}
                onClick={() => setActiveTab(tab.toLowerCase())}
                badge={tab === "Collection" ? String(totalItems) : null}
              />
            ))}
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
                  collectionData.slice(0, 5).map((item) => {
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
                  Value Over Time
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

              {/* Chart */}
              <div style={{
                height: "180px",
                position: "relative",
              }}>
                <svg width="100%" height="100%" viewBox="0 0 1000 180" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map(i => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 60}
                      x2="1000"
                      y2={i * 60}
                      stroke="#f0f0f0"
                      strokeWidth="1"
                    />
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
                </svg>

                {/* Legend */}
                <div style={{
                  display: "flex",
                  gap: "24px",
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "16px",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "20px", height: "3px", background: "#D4AF37", borderRadius: "2px" }} />
                    {valuationMode === "spot" ? "Melt Value" : "Book Value"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              paddingTop: "8px",
            }}>
              <ActionButton label="Add Piece" primary onClick={() => setIsAddModalOpen(true)} />
              <ActionButton label="Export" onClick={() => {}} />
              <Link href="/collage">
                <ActionButton label="View Collage" onClick={() => {}} />
              </Link>
            </div>
          </>
        )}

        {/* Collection Tab */}
        {activeTab === "collection" && (
          <CollectionGrid onAddItem={() => setIsAddModalOpen(true)} />
        )}

        {/* Collage Tab */}
        {activeTab === "collage" && (
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "48px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1a1a1a",
              marginBottom: "16px",
            }}>
              Photo Collage
            </h2>
            <p style={{
              fontSize: "14px",
              color: "#666",
              marginBottom: "24px",
            }}>
              View all your bullion photos in a beautiful collage format
            </p>
            <Link href="/collage">
              <ActionButton label="Open Photo Collage" primary onClick={() => {}} />
            </Link>
          </div>
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
