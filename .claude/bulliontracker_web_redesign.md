import React, { useState } from "react";

const BullionTrackerWeb = () => {
  const [valuationMode, setValuationMode] = useState("spot");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState("1M");

  const spotPrices = {
    gold: { price: 4350.48, change: 2.34, changePercent: 0.54 },
    silver: { price: 72.55, change: -0.12, changePercent: -0.17 },
    platinum: { price: 2098.43, change: 15.67, changePercent: 0.75 },
  };

  const portfolioData = {
    spot: {
      value: 4350.48,
      gain: 2433.96,
      returnPct: 127.12,
      costBasis: 1916.52,
      dayChange: 102.45,
      dayChangePercent: 2.41,
    },
    book: {
      value: 1916.52,
      gain: 0,
      returnPct: 0,
      costBasis: 1916.52,
      dayChange: 0,
      dayChangePercent: 0,
    },
  };

  const holdings = [
    { metal: "Gold", oz: "1.007", value: 4350.48, percentage: 100, color: "#D4AF37", pieces: 12 },
    { metal: "Silver", oz: "0.00", value: 0, percentage: 0, color: "#A8A8A8", pieces: 0 },
    { metal: "Platinum", oz: "0.00", value: 0, percentage: 0, color: "#E5E4E2", pieces: 0 },
  ];

  const recentActivity = [
    { date: "2026-01-03", type: "Purchase", metal: "Gold", oz: 0.1, value: 435.05, premium: 5.2 },
    { date: "2025-12-28", type: "Purchase", metal: "Gold", oz: 0.907, value: 1481.47, premium: 4.8 },
  ];

  const insights = [
    { label: "Average Premium Paid", value: "5.0%", trend: "good" },
    { label: "Portfolio Diversity", value: "Low", trend: "warning" },
    { label: "Best Performer", value: "Gold (+127%)", trend: "good" },
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
      background: "linear-gradient(135deg, #F8F7F4 0%, #E8E6E1 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Premium Spot Price Banner */}
      <div style={{
        background: "linear-gradient(90deg, #0F0F0F 0%, #1a1a1a 50%, #0F0F0F 100%)",
        padding: "16px 48px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "48px",
        borderBottom: "1px solid #2a2a2a",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <PricePill
          metal="Au"
          price={spotPrices.gold.price}
          change={spotPrices.gold.change}
          changePercent={spotPrices.gold.changePercent}
          color="#D4AF37"
        />
        <Divider />
        <PricePill
          metal="Ag"
          price={spotPrices.silver.price}
          change={spotPrices.silver.change}
          changePercent={spotPrices.silver.changePercent}
          color="#A8A8A8"
        />
        <Divider />
        <PricePill
          metal="Pt"
          price={spotPrices.platinum.price}
          change={spotPrices.platinum.change}
          changePercent={spotPrices.platinum.changePercent}
          color="#E5E4E2"
        />
        <div style={{
          fontSize: "11px",
          color: "#777",
          marginLeft: "24px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <div style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#22C55E",
            animation: "pulse 2s infinite",
          }} />
          Live · Updated 7:53 AM
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "40px 32px",
      }}>
        {/* Enhanced Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "700",
                color: "white",
                boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)",
              }}>
                ฿
              </div>
              <h1 style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#1a1a1a",
                margin: 0,
                letterSpacing: "-0.5px",
              }}>
                Bullion Collection
              </h1>
            </div>
            <p style={{
              fontSize: "15px",
              color: "#666",
              margin: 0,
              paddingLeft: "52px",
            }}>
              12 pieces · 1.007 troy oz gold · Last updated today
            </p>
          </div>
          <div style={{
            display: "flex",
            gap: "8px",
            background: "white",
            borderRadius: "12px",
            padding: "6px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}>
            {["Dashboard", "Collection", "Analytics", "Photos"].map(tab => (
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

        {/* Top Row - Portfolio Value Hero Card */}
        <div style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
          borderRadius: "24px",
          padding: "36px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative gradient orb */}
          <div style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
            position: "relative",
          }}>
            <div>
              <span style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "1px",
                display: "block",
                marginBottom: "12px",
              }}>
                Total Portfolio Value
              </span>
              <div style={{
                fontSize: "56px",
                fontFamily: "'SF Mono', 'Monaco', monospace",
                fontWeight: "700",
                color: "white",
                marginBottom: "12px",
                letterSpacing: "-2px",
              }}>
                ${currentData.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <span style={{
                  fontSize: "18px",
                  fontFamily: "monospace",
                  color: currentData.dayChange >= 0 ? "#22C55E" : "#EF4444",
                  fontWeight: "600",
                }}>
                  {currentData.dayChange >= 0 ? "↑" : "↓"} ${Math.abs(currentData.dayChange).toFixed(2)} ({currentData.dayChangePercent >= 0 ? "+" : ""}{currentData.dayChangePercent}%)
                </span>
                <span style={{
                  fontSize: "13px",
                  color: "#777",
                }}>
                  Today
                </span>
              </div>
            </div>

            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "4px",
              backdropFilter: "blur(10px)",
            }}>
              <ToggleButton
                label="Spot Value"
                active={valuationMode === "spot"}
                onClick={() => setValuationMode("spot")}
                dark
              />
              <ToggleButton
                label="Book Value"
                active={valuationMode === "book"}
                onClick={() => setValuationMode("book")}
                dark
              />
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            position: "relative",
          }}>
            <MetricCard
              label="Cost Basis"
              value={`$${currentData.costBasis.toLocaleString()}`}
              subtitle="Total invested"
              dark
            />
            <MetricCard
              label="Total Gain"
              value={`${currentData.gain >= 0 ? "+" : ""}$${currentData.gain.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              subtitle="Unrealized profit"
              positive={currentData.gain >= 0}
              dark
            />
            <MetricCard
              label="Total Return"
              value={`${currentData.returnPct >= 0 ? "+" : ""}${currentData.returnPct.toFixed(2)}%`}
              subtitle="Since inception"
              positive={currentData.returnPct >= 0}
              dark
            />
          </div>
        </div>

        {/* Middle Row - Holdings & Insights */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          marginBottom: "24px",
        }}>
          {/* Holdings Breakdown Card */}
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}>
              <span style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}>
                Holdings Breakdown
              </span>
              <span style={{
                fontSize: "12px",
                color: "#999",
              }}>
                By Metal Type
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {holdings.map(h => (
                <HoldingRow key={h.metal} {...h} />
              ))}
            </div>

            {/* Visual allocation bar */}
            <div style={{
              marginTop: "24px",
              height: "8px",
              borderRadius: "8px",
              background: "#F5F5F5",
              overflow: "hidden",
              display: "flex",
            }}>
              {holdings.map(h => (
                h.percentage > 0 && (
                  <div
                    key={h.metal}
                    style={{
                      width: `${h.percentage}%`,
                      background: h.color,
                      transition: "width 0.3s ease",
                    }}
                  />
                )
              ))}
            </div>
          </div>

          {/* Insights Card */}
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}>
            <span style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#888",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              display: "block",
              marginBottom: "24px",
            }}>
              Portfolio Insights
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {insights.map((insight, i) => (
                <InsightItem key={i} {...insight} />
              ))}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}>
            <div>
              <span style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                display: "block",
                marginBottom: "6px",
              }}>
                Value Over Time
              </span>
              <span style={{
                fontSize: "12px",
                color: "#999",
              }}>
                Historical performance tracking
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {["24H", "1W", "1M", "3M", "1Y", "ALL"].map(range => (
                <TimeRangeButton
                  key={range}
                  label={range}
                  active={timeRange === range}
                  onClick={() => setTimeRange(range)}
                />
              ))}
            </div>
          </div>

          {/* Enhanced Chart */}
          <div style={{
            height: "240px",
            position: "relative",
            padding: "0 8px",
          }}>
            <svg width="100%" height="100%" viewBox="0 0 1000 240" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 60}
                  x2="1000"
                  y2={i * 60}
                  stroke="#f5f5f5"
                  strokeWidth="1"
                />
              ))}

              {/* Area fill under spot line */}
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <path
                d={`M 0 ${240 - (chartData[0].spot - 3600) / 12} ${chartData.map((d, i) =>
                  `L ${(i / 29) * 1000} ${240 - (d.spot - 3600) / 12}`
                ).join(" ")} L 1000 240 L 0 240 Z`}
                fill="url(#goldGradient)"
              />

              {/* Spot value line */}
              <path
                d={`M 0 ${240 - (chartData[0].spot - 3600) / 12} ${chartData.map((d, i) =>
                  `L ${(i / 29) * 1000} ${240 - (d.spot - 3600) / 12}`
                ).join(" ")}`}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Book value line */}
              <path
                d={`M 0 175 L 1000 175`}
                fill="none"
                stroke="#bbb"
                strokeWidth="2"
                strokeDasharray="8 6"
              />
            </svg>

            {/* Legend */}
            <div style={{
              display: "flex",
              gap: "32px",
              fontSize: "13px",
              color: "#666",
              marginTop: "20px",
              justifyContent: "center",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  width: "24px",
                  height: "3px",
                  background: "#D4AF37",
                  borderRadius: "2px"
                }} />
                Spot/Melt Value
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  width: "24px",
                  height: "2px",
                  background: "#bbb",
                  borderRadius: "2px",
                  borderTop: "2px dashed #bbb"
                }} />
                Book Value
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: "white",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          marginBottom: "24px",
        }}>
          <span style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            display: "block",
            marginBottom: "24px",
          }}>
            Recent Activity
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {recentActivity.map((activity, i) => (
              <ActivityRow key={i} {...activity} />
            ))}
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          paddingTop: "8px",
        }}>
          <ActionButton label="+ Add Piece" primary icon="+" />
          <ActionButton label="Export Data" icon="↓" />
          <ActionButton label="View Photo Collage" icon="🖼️" />
          <ActionButton label="Generate Report" icon="📊" />
        </div>
      </div>
    </div>
  );
};

// Sub-components

const Divider = () => (
  <span style={{ color: "#333", fontSize: "10px" }}>•</span>
);

const PricePill = ({ metal, price, change, changePercent, color }) => {
  const isPositive = change >= 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span style={{
          fontSize: "14px",
          fontWeight: "700",
          color: color,
        }}>
          {metal}
        </span>
        <span style={{
          fontSize: "16px",
          fontFamily: "'SF Mono', monospace",
          color: "white",
          fontWeight: "500",
        }}>
          ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      </div>
      <span style={{
        fontSize: "11px",
        color: isPositive ? "#22C55E" : "#EF4444",
        fontWeight: "600",
        background: isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
        padding: "2px 6px",
        borderRadius: "4px",
      }}>
        {isPositive ? "+" : ""}{changePercent}%
      </span>
    </div>
  );
};

const TabButton = ({ label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#F5F5F5" : "transparent",
      border: "none",
      borderRadius: "8px",
      padding: "10px 20px",
      fontSize: "14px",
      fontWeight: active ? "600" : "500",
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
        top: "4px",
        right: "6px",
        background: "#D4AF37",
        color: "white",
        fontSize: "9px",
        fontWeight: "700",
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

const ToggleButton = ({ label, active, onClick, dark }) => (
  <button
    onClick={onClick}
    style={{
      background: active
        ? (dark ? "rgba(255,255,255,0.25)" : "white")
        : "transparent",
      border: "none",
      borderRadius: "8px",
      padding: "10px 18px",
      fontSize: "13px",
      fontWeight: "600",
      color: active
        ? (dark ? "white" : "#1a1a1a")
        : (dark ? "rgba(255,255,255,0.6)" : "#888"),
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: active && !dark ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
      backdropFilter: active && dark ? "blur(10px)" : "none",
    }}
  >
    {label}
  </button>
);

const MetricCard = ({ label, value, subtitle, positive, dark }) => (
  <div style={{
    background: dark ? "rgba(255,255,255,0.08)" : "#F8F8F8",
    borderRadius: "12px",
    padding: "20px",
    backdropFilter: dark ? "blur(10px)" : "none",
  }}>
    <div style={{
      fontSize: "11px",
      color: dark ? "#999" : "#888",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: "8px",
      fontWeight: "600",
    }}>
      {label}
    </div>
    <div style={{
      fontSize: "24px",
      fontFamily: "'SF Mono', monospace",
      fontWeight: "700",
      color: positive !== undefined
        ? (positive ? "#22C55E" : "#EF4444")
        : (dark ? "white" : "#1a1a1a"),
      marginBottom: "4px",
    }}>
      {value}
    </div>
    {subtitle && (
      <div style={{
        fontSize: "11px",
        color: dark ? "#777" : "#999",
      }}>
        {subtitle}
      </div>
    )}
  </div>
);

const HoldingRow = ({ metal, oz, value, percentage, color, pieces }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    background: "#FAFAFA",
    borderRadius: "12px",
    transition: "all 0.2s ease",
    cursor: "pointer",
  }}
  onMouseEnter={e => e.currentTarget.style.background = "#F5F5F5"}
  onMouseLeave={e => e.currentTarget.style.background = "#FAFAFA"}
  >
    <div style={{
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      background: color,
      marginRight: "16px",
      flexShrink: 0,
      boxShadow: `0 0 0 3px ${color}20`,
    }} />
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: "15px",
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: "4px",
      }}>
        {metal}
      </div>
      <div style={{
        fontSize: "12px",
        color: "#999",
      }}>
        {pieces} {pieces === 1 ? "piece" : "pieces"}
      </div>
    </div>
    <div style={{
      textAlign: "right",
      marginRight: "24px",
    }}>
      <div style={{
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#666",
        marginBottom: "4px",
      }}>
        {oz} ozt
      </div>
    </div>
    <div style={{
      textAlign: "right",
      marginRight: "24px",
      minWidth: "100px",
    }}>
      <div style={{
        fontSize: "16px",
        fontFamily: "monospace",
        fontWeight: "600",
        color: "#1a1a1a",
      }}>
        ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </div>
    </div>
    <div style={{
      fontSize: "15px",
      fontFamily: "monospace",
      fontWeight: "600",
      color: percentage > 0 ? "#1a1a1a" : "#ccc",
      minWidth: "50px",
      textAlign: "right",
    }}>
      {percentage}%
    </div>
  </div>
);

const InsightItem = ({ label, value, trend }) => {
  const trendColors = {
    good: "#22C55E",
    warning: "#F59E0B",
    bad: "#EF4444",
  };

  return (
    <div style={{
      padding: "16px",
      background: "#FAFAFA",
      borderRadius: "12px",
      borderLeft: `4px solid ${trendColors[trend]}`,
    }}>
      <div style={{
        fontSize: "12px",
        color: "#888",
        marginBottom: "6px",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "16px",
        fontWeight: "600",
        color: "#1a1a1a",
      }}>
        {value}
      </div>
    </div>
  );
};

const ActivityRow = ({ date, type, metal, oz, value, premium }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: "#FAFAFA",
    borderRadius: "12px",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
      }}>
        +
      </div>
      <div>
        <div style={{
          fontSize: "14px",
          fontWeight: "600",
          color: "#1a1a1a",
          marginBottom: "4px",
        }}>
          {type} · {metal}
        </div>
        <div style={{
          fontSize: "12px",
          color: "#999",
        }}>
          {date} · {oz} ozt
        </div>
      </div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{
        fontSize: "16px",
        fontFamily: "monospace",
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: "4px",
      }}>
        ${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </div>
      <div style={{
        fontSize: "11px",
        color: "#22C55E",
        fontWeight: "600",
      }}>
        +{premium}% premium
      </div>
    </div>
  </div>
);

const TimeRangeButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "#1a1a1a" : "transparent",
      border: active ? "none" : "1px solid #E0E0E0",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "12px",
      fontWeight: "600",
      color: active ? "white" : "#666",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
  >
    {label}
  </button>
);

const ActionButton = ({ label, primary, icon }) => (
  <button
    style={{
      background: primary
        ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
        : "white",
      color: primary ? "white" : "#1a1a1a",
      border: primary ? "none" : "2px solid #E0E0E0",
      borderRadius: "14px",
      padding: "16px 32px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: primary
        ? "0 4px 16px rgba(0,0,0,0.15)"
        : "0 2px 8px rgba(0,0,0,0.05)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = primary
        ? "0 8px 24px rgba(0,0,0,0.2)"
        : "0 4px 16px rgba(0,0,0,0.1)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = primary
        ? "0 4px 16px rgba(0,0,0,0.15)"
        : "0 2px 8px rgba(0,0,0,0.05)";
    }}
  >
    {label}
  </button>
);

export default BullionTrackerWeb;
