'use client';

import { useTopPerformers } from '@/hooks/useTopPerformers';

const METAL_LABELS: Record<string, string> = {
  gold: 'Gold',
  silver: 'Silver',
  platinum: 'Platinum',
};

const METAL_COLORS: Record<string, string> = {
  gold: '#D4AF37',
  silver: '#A8A8A8',
  platinum: '#E5E4E2',
};

export function TopPerformers() {
  const { metals, coins, isLoading } = useTopPerformers();

  if (isLoading) {
    return (
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        marginBottom: "28px",
      }}>
        <span style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}>
          Top Performers (30 Days)
        </span>
        <div style={{ padding: "40px 0", textAlign: "center", color: "#888" }}>
          Loading performance data...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "white",
      borderRadius: "20px",
      padding: "28px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      marginBottom: "28px",
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
        Top Performers (30 Days)
      </span>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}>
        {/* Metals Section */}
        <div style={{
          padding: "16px",
          background: "#FAFAFA",
          borderRadius: "12px",
        }}>
          <div style={{
            fontSize: "11px",
            fontWeight: "600",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "16px",
          }}>
            Metals
          </div>

          {metals?.bestPerformer && (
            <PerformanceRow
              label={METAL_LABELS[metals.bestPerformer.metal]}
              color={METAL_COLORS[metals.bestPerformer.metal]}
              changePercent={metals.bestPerformer.changePercent}
              priceFrom={metals.bestPerformer.priceOneMonthAgo}
              priceTo={metals.bestPerformer.currentPrice}
              type="best"
            />
          )}

          {metals?.worstPerformer && metals.bestPerformer?.metal !== metals.worstPerformer.metal && (
            <PerformanceRow
              label={METAL_LABELS[metals.worstPerformer.metal]}
              color={METAL_COLORS[metals.worstPerformer.metal]}
              changePercent={metals.worstPerformer.changePercent}
              priceFrom={metals.worstPerformer.priceOneMonthAgo}
              priceTo={metals.worstPerformer.currentPrice}
              type="worst"
            />
          )}
        </div>

        {/* Coins Section - Coming Soon */}
        <div style={{
          padding: "16px",
          background: "#FAFAFA",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            fontSize: "11px",
            fontWeight: "600",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "16px",
          }}>
            Your Coins
          </div>

          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: "14px",
            fontStyle: "italic",
          }}>
            Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}

interface PerformanceRowProps {
  label: string;
  color: string;
  changePercent: number;
  priceFrom: number;
  priceTo: number;
  type: 'best' | 'worst';
}

function PerformanceRow({ label, color, changePercent, priceFrom, priceTo, type }: PerformanceRowProps) {
  const isPositive = changePercent >= 0;

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid #EBEBEB",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          fontSize: "10px",
          fontWeight: "600",
          color: "#999",
          textTransform: "uppercase",
        }}>
          {type === 'best' ? 'Best' : 'Worst'}
        </span>
        <span style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: color,
        }} />
        <span style={{
          fontSize: "14px",
          fontWeight: "500",
          color: "#1a1a1a",
        }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{
          fontSize: "12px",
          fontFamily: "monospace",
          color: "#888",
        }}>
          ${priceFrom.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → ${priceTo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span style={{
          fontSize: "13px",
          fontWeight: "600",
          color: isPositive ? "#22A06B" : "#E53935",
        }}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

interface CoinPerformanceRowProps {
  title: string;
  grade: string;
  changePercent: number;
  priceFrom: number;
  priceTo: number;
  type: 'best' | 'worst';
}

function CoinPerformanceRow({ title, grade, changePercent, priceFrom, priceTo, type }: CoinPerformanceRowProps) {
  const isPositive = changePercent >= 0;

  // Truncate title if too long
  const displayTitle = title.length > 30 ? title.substring(0, 27) + '...' : title;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      padding: "10px 0",
      borderBottom: "1px solid #EBEBEB",
      gap: "6px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            fontSize: "10px",
            fontWeight: "600",
            color: "#999",
            textTransform: "uppercase",
          }}>
            {type === 'best' ? 'Best' : 'Worst'}
          </span>
          <span style={{
            fontSize: "13px",
            fontWeight: "500",
            color: "#1a1a1a",
          }}>
            {displayTitle}
          </span>
        </div>
        <span style={{
          fontSize: "13px",
          fontWeight: "600",
          color: isPositive ? "#22A06B" : "#E53935",
        }}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: "11px",
          color: "#888",
          padding: "2px 6px",
          background: "#E8E8E8",
          borderRadius: "4px",
        }}>
          {grade}
        </span>
        <span style={{
          fontSize: "11px",
          fontFamily: "monospace",
          color: "#888",
        }}>
          ${priceFrom.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} → ${priceTo.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}
