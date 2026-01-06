import React, { useState } from "react";

const BullionTrackerWeb = () => {
  const [valuationMode, setValuationMode] = useState("spot");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState("1M");

  const spotPrices = {
    gold: 4350.48,
    silver: 72.55,
    platinum: 2098.43,
  };

  const portfolioData = {
    spot: {
      value: 4350.48,
      gain: 2433.96,
      returnPct: 127.12,
      costBasis: 1916.52,
    },
    book: {
      value: 1916.52,
      gain: 0,
      returnPct: 0,
      costBasis: 1916.52,
    },
  };

  const holdings = [
    { metal: "Gold", oz: "1.007", value: 4350.48, percentage: 100, color: "#D4AF37" },
    { metal: "Silver", oz: "0.00", value: 0, percentage: 0, color: "#A8A8A8" },
    { metal: "Platinum", oz: "0.00", value: 0, percentage: 0, color: "#E5E4E2" },
  ];

  const currentData = portfolioData[valuationMode];

  // Mock chart data points
  const chartData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    spot: 3800 + Math.sin(i * 0.3) * 200 + i * 18,
    book: 1916.52,
  }));

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
        <PricePill metal="Au" price={spotPrices.gold} color="#D4AF37" />
        <span style={{ color: "#444", fontSize: "8px" }}>•</span>
        <PricePill metal="Ag" price={spotPrices.silver} color="#A8A8A8" />
        <span style={{ color: "#444", fontSize: "8px" }}>•</span>
        <PricePill metal="Pt" price={spotPrices.platinum} color="#E5E4E2" />
        <span style={{
          fontSize: "11px",
          color: "#555",
          marginLeft: "20px",
        }}>
          Updated 7:53 AM
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
              12 pieces · 1.007 ozt gold
            </p>
          </div>
          <div style={{
            display: "flex",
            gap: "8px",
          }}>
            {["Dashboard", "Collection", "Photos"].map(tab => (
              <TabButton
                key={tab}
                label={tab}
                active={activeTab === tab.toLowerCase()}
                onClick={() => setActiveTab(tab.toLowerCase())}
                badge={tab === "Collection" ? "12" : null}
              />
            ))}
          </div>
        </div>

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
              ${currentData.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>

            <div style={{
              display: "flex",
              gap: "32px",
            }}>
              <MetricItem label="Cost Basis" value={`$${currentData.costBasis.toLocaleString()}`} />
              <MetricItem
                label="Gain"
                value={`${currentData.gain >= 0 ? "+" : ""}$${currentData.gain.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                positive={currentData.gain >= 0}
              />
              <MetricItem
                label="Return"
                value={`${currentData.returnPct >= 0 ? "+" : ""}${currentData.returnPct.toFixed(2)}%`}
                positive={currentData.returnPct >= 0}
              />
            </div>
          </div>

          {/* Holdings Breakdown Card */}
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
              Holdings Breakdown
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {holdings.map(h => (
                <HoldingRow key={h.metal} {...h} />
              ))}
            </div>
          </div>
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
              {["24H", "1W", "1M", "1Y", "5Y"].map(range => (
                <TimeRangeButton
                  key={range}
                  label={range}
                  active={timeRange === range}
                  onClick={() => setTimeRange(range)}
                />
              ))}
            </div>
          </div>

          {/* Mock Chart */}
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
              {/* Melt value line (solid gold) */}
              <path
                d={`M 0 ${180 - (chartData[0].spot - 3600) / 12} ${chartData.map((d, i) =>
                  `L ${(i / 29) * 1000} ${180 - (d.spot - 3600) / 12}`
                ).join(" ")}`}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Book value line (dashed) */}
              <path
                d={`M 0 140 L 1000 140`}
                fill="none"
                stroke="#ccc"
                strokeWidth="2"
                strokeDasharray="8 6"
              />
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
                Melt Value
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "20px", height: "2px", background: "#ccc", borderRadius: "2px", borderTop: "2px dashed #ccc" }} />
                Book Value
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
          <ActionButton label="Add Piece" primary />
          <ActionButton label="Export" />
          <ActionButton label="View Collage" />
        </div>
      </div>
    </div>
  );
};

// Sub-components

const PricePill = ({ metal, price, color }) => (
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
      ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
    </span>
    <span style={{ fontSize: "10px", color: "#666" }}>/oz</span>
  </div>
);

const TabButton = ({ label, active, onClick, badge }) => (
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

const ToggleButton = ({ label, active, onClick }) => (
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

const MetricItem = ({ label, value, positive }) => (
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

const HoldingRow = ({ metal, oz, value, percentage, color }) => (
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
      ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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

const TimeRangeButton = ({ label, active, onClick }) => (
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

const ActionButton = ({ label, primary }) => (
  <button
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

export default BullionTrackerWeb;
