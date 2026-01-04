import React, { useState } from "react";

const BullionTracker = () => {
  const [valuationMode, setValuationMode] = useState("spot");
  const [activeTab, setActiveTab] = useState("dashboard");

  const spotPrices = {
    gold: 4319,
    silver: 71.57,
    platinum: 2049,
  };

  const portfolioData = {
    spot: {
      value: 4426.36,
      gain: 2509.84,
      returnPct: 130.96,
    },
    book: {
      value: 1916.52,
      gain: 0,
      returnPct: 0,
    },
  };

  const allocation = [
    { metal: "Gold", percentage: 68, color: "#D4AF37" },
    { metal: "Silver", percentage: 28, color: "#C0C0C0" },
    { metal: "Platinum", percentage: 4, color: "#E5E4E2" },
  ];

  const currentData = portfolioData[valuationMode];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F8F7F4",
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: "430px",
      margin: "0 auto",
      position: "relative",
      paddingBottom: "100px",
    }}>
      {/* Status Bar Spacer */}
      <div style={{ height: "44px" }} />

      {/* Spot Price Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <PricePill metal="Au" price={spotPrices.gold} color="#D4AF37" />
        <PricePill metal="Ag" price={spotPrices.silver} color="#A8A8A8" />
        <PricePill metal="Pt" price={spotPrices.platinum} color="#E5E4E2" />
      </div>

      {/* Main Content */}
      <div style={{ padding: "24px 20px" }}>
        {/* User Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}>
          <div>
            <h1 style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1a1a1a",
              margin: 0,
              letterSpacing: "-0.5px",
            }}>
              Arunava's Stack
            </h1>
            <p style={{
              fontSize: "13px",
              color: "#888",
              margin: "4px 0 0 0",
            }}>
              Last updated just now
            </p>
          </div>
          <button style={{
            background: "#1a1a1a",
            color: "white",
            border: "none",
            borderRadius: "20px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <span style={{ fontSize: "18px", fontWeight: "300" }}>+</span>
            Add
          </button>
        </div>

        {/* Portfolio Value Card */}
        <div style={{
          background: "white",
          borderRadius: "24px",
          padding: "28px",
          marginBottom: "16px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
        }}>
          {/* Toggle */}
          <div style={{
            display: "flex",
            background: "#F3F2EF",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "24px",
            width: "fit-content",
          }}>
            <ToggleButton
              active={valuationMode === "spot"}
              onClick={() => setValuationMode("spot")}
              label="Spot Value"
            />
            <ToggleButton
              active={valuationMode === "book"}
              onClick={() => setValuationMode("book")}
              label="Book Value"
            />
          </div>

          {/* Hero Value */}
          <div style={{ marginBottom: "24px" }}>
            <p style={{
              fontSize: "13px",
              color: "#888",
              margin: "0 0 6px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              Portfolio Value
            </p>
            <h2 style={{
              fontSize: "48px",
              fontWeight: "600",
              color: "#1a1a1a",
              margin: 0,
              letterSpacing: "-2px",
              fontFamily: "'DM Mono', monospace",
            }}>
              ${currentData.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h2>
          </div>

          {/* Gain/Loss Row */}
          <div style={{
            display: "flex",
            gap: "32px",
            paddingTop: "20px",
            borderTop: "1px solid #F0F0F0",
          }}>
            <div>
              <p style={{
                fontSize: "12px",
                color: "#888",
                margin: "0 0 4px 0",
              }}>
                Total Gain
              </p>
              <p style={{
                fontSize: "20px",
                fontWeight: "600",
                color: currentData.gain >= 0 ? "#22A06B" : "#DE350B",
                margin: 0,
                fontFamily: "'DM Mono', monospace",
              }}>
                {currentData.gain >= 0 ? "+" : ""}${currentData.gain.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p style={{
                fontSize: "12px",
                color: "#888",
                margin: "0 0 4px 0",
              }}>
                Return
              </p>
              <p style={{
                fontSize: "20px",
                fontWeight: "600",
                color: currentData.returnPct >= 0 ? "#22A06B" : "#DE350B",
                margin: 0,
                fontFamily: "'DM Mono', monospace",
              }}>
                {currentData.returnPct >= 0 ? "+" : ""}{currentData.returnPct.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Allocation Card */}
        <div style={{
          background: "white",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
        }}>
          <p style={{
            fontSize: "13px",
            color: "#888",
            margin: "0 0 16px 0",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            Allocation
          </p>
          
          {/* Horizontal Bar */}
          <div style={{
            display: "flex",
            height: "8px",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "16px",
          }}>
            {allocation.map((item, i) => (
              <div
                key={item.metal}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                  borderRight: i < allocation.length - 1 ? "2px solid white" : "none",
                }}
              />
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "24px" }}>
            {allocation.map((item) => (
              <div key={item.metal} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "3px",
                  backgroundColor: item.color,
                }} />
                <span style={{ fontSize: "14px", color: "#666" }}>
                  {item.metal} <span style={{ color: "#aaa" }}>{item.percentage}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "430px",
        background: "white",
        borderTop: "1px solid #F0F0F0",
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 0 28px 0",
      }}>
        <TabButton
          icon="◎"
          label="Dashboard"
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
        />
        <TabButton
          icon="◉"
          label="Collection"
          active={activeTab === "collection"}
          onClick={() => setActiveTab("collection")}
          badge={12}
        />
        <TabButton
          icon="❖"
          label="Photos"
          active={activeTab === "photos"}
          onClick={() => setActiveTab("photos")}
        />
      </div>
    </div>
  );
};

const PricePill = ({ metal, price, color }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}>
    <span style={{
      fontSize: "11px",
      fontWeight: "600",
      color: color,
      opacity: 0.9,
    }}>
      {metal}
    </span>
    <span style={{
      fontSize: "14px",
      fontWeight: "500",
      color: "white",
      fontFamily: "'DM Mono', monospace",
    }}>
      ${price.toLocaleString()}
      <span style={{ fontSize: "10px", color: "#888", marginLeft: "2px" }}>/oz</span>
    </span>
  </div>
);

const ToggleButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "white" : "transparent",
      border: "none",
      borderRadius: "10px",
      padding: "10px 16px",
      fontSize: "14px",
      fontWeight: "500",
      color: active ? "#1a1a1a" : "#888",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: active ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
    }}
  >
    {label}
  </button>
);

const TabButton = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      background: "transparent",
      border: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
      cursor: "pointer",
      position: "relative",
      padding: "4px 16px",
    }}
  >
    <span style={{
      fontSize: "22px",
      color: active ? "#1a1a1a" : "#bbb",
      transition: "color 0.2s ease",
    }}>
      {icon}
    </span>
    <span style={{
      fontSize: "11px",
      fontWeight: "500",
      color: active ? "#1a1a1a" : "#888",
    }}>
      {label}
    </span>
    {badge && (
      <span style={{
        position: "absolute",
        top: 0,
        right: 8,
        background: "#D4AF37",
        color: "white",
        fontSize: "10px",
        fontWeight: "600",
        padding: "2px 6px",
        borderRadius: "10px",
        minWidth: "18px",
        textAlign: "center",
      }}>
        {badge}
      </span>
    )}
  </button>
);

export default BullionTracker;
