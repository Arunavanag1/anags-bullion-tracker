# Mobile App Numismatics Implementation Plan

**Document Version:** 1.0
**Date:** January 6, 2026
**Author:** Claude Sonnet 4.5
**Status:** Design Phase

---

## Executive Summary

This document outlines the comprehensive plan to port all numismatics functionality from the web application to the React Native mobile app. The implementation will add full coin collection management capabilities including graded coin tracking, raw coin tracking, PCGS/NGC price guide integration, and automatic valuation.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Architecture & Technical Design](#3-architecture--technical-design)
4. [UI/UX Design for Mobile](#4-uiux-design-for-mobile)
5. [Component Specifications](#5-component-specifications)
6. [API Integration](#6-api-integration)
7. [Data Models](#7-data-models)
8. [Implementation Phases](#8-implementation-phases)
9. [Testing Strategy](#9-testing-strategy)
10. [Deployment Considerations](#10-deployment-considerations)

---

## 1. Overview

### 1.1 Objectives

- Port complete numismatics functionality from web to mobile app
- Maintain feature parity with web application
- Optimize UI/UX for mobile touchscreen interaction
- Ensure offline-capable coin search and selection
- Integrate PCGS/NGC price guide data
- Support both RAW and GRADED coin workflows

### 1.2 Key Features to Implement

#### Core Features
- **Coin Search**: Search 100+ coin references by year, series, denomination
- **Dual Workflow**: RAW (ungraded) and GRADED (PCGS/NGC) coin entry
- **Auto-Fill Pricing**: Automatic value population from price guide database
- **Grade Selection**: Support for 31 grade levels (G4 through PR70)
- **Problem Coin Tracking**: Track cleaned, damaged, holed, repaired coins
- **Custom Valuation Override**: Allow manual value entry when needed
- **Metal Type Selection**: Auto-detect or manual override for coin metal content

#### Supporting Features
- **Confidence Indicators**: Visual feedback on price guide data quality
- **Category Badges**: Clear visual distinction between BULLION and NUMISMATIC
- **Problem Badges**: Visual indicators for problem coins
- **Change Coin Selection**: Ability to switch selected coin during entry
- **Image Upload**: Support for multiple coin images
- **Estimated Grade**: Toggle for estimated vs. actual grade for RAW coins

### 1.3 Success Criteria

- [ ] Users can add numismatic items via mobile app
- [ ] Price guide data populates automatically
- [ ] Search performance < 500ms for coin lookup
- [ ] UI is intuitive and requires no training
- [ ] Offline coin search works with cached data
- [ ] Feature parity with web application achieved

---

## 2. Current State Analysis

### 2.1 Web Application Components (Implemented)

#### API Endpoints
```
/api/coins/search              - Search coin references
/api/coins/price-guide         - Fetch price guide data
/api/coins/[pcgsNumber]        - Get specific coin details
/api/grades                    - List all valid grades
/api/collection (POST)         - Create collection item with numismatics support
/api/collection/summary        - Get collection totals
```

#### React Hooks
```typescript
useCoinSearch(query: string)           - Search coins
usePriceGuide(coinId, grade)           - Fetch pricing
useGrades()                            - Fetch valid grades
useCollection()                        - Manage collection items
```

#### Key Components
```
AddItemModal.tsx               - Main entry form (multi-step)
CategoryBadge.tsx              - BULLION/NUMISMATIC indicator
ConfidenceIndicator.tsx        - Price guide confidence display
ProblemBadge.tsx               - Problem coin indicator
CollectionCard.tsx             - Individual item display
CollectionGrid.tsx             - Grid view with filters
```

#### Database Schema
```
CoinReference                  - 100 coin records (Morgan, Peace, Mercury, etc.)
CoinPriceGuide                - 3,100+ price entries (100 coins × 31 grades)
ValidGrade                     - 31 grade definitions
CollectionItem                 - User's collection (enhanced for numismatics)
```

### 2.2 Mobile Application Current State

#### Existing Screens
```
DashboardScreen.tsx            - Portfolio overview
CollectionScreen.tsx           - Item list view
AddItemScreen.tsx              - Add bullion items only
CollageScreen.tsx              - Visual collection display
LoginScreen.tsx                - Authentication
RegisterScreen.tsx             - User registration
```

#### Existing Components
```
PortfolioChart.tsx             - Value over time
AllocationDonutChart.tsx       - Metal allocation
Card, Button, Input            - UI primitives
```

#### API Layer
```typescript
src/lib/api.ts                 - API client (needs extension)
```

#### Data Storage
```
AsyncStorage                   - Local data persistence
Settings management            - User preferences
Daily tracking                 - Historical snapshots
```

### 2.3 Gap Analysis

| Feature | Web Status | Mobile Status | Gap |
|---------|-----------|---------------|-----|
| Coin Search | ✅ Implemented | ❌ Missing | Full implementation needed |
| Price Guide API | ✅ Implemented | ❌ Missing | API client extension needed |
| Grade Selection | ✅ Implemented | ❌ Missing | UI component needed |
| RAW/GRADED Workflow | ✅ Implemented | ❌ Missing | Multi-step form needed |
| Auto-Fill Pricing | ✅ Implemented | ❌ Missing | Hook integration needed |
| Problem Coin Tracking | ✅ Implemented | ❌ Missing | UI toggle needed |
| Numismatic Display | ✅ Implemented | ❌ Missing | Card redesign needed |
| Category Filtering | ✅ Implemented | ❌ Missing | Filter UI needed |

---

## 3. Architecture & Technical Design

### 3.1 Technology Stack

**Existing Stack (Maintain):**
- React Native with TypeScript
- Expo framework
- React Navigation
- AsyncStorage for local data
- Axios for API calls

**New Dependencies (Add):**
```json
{
  "react-native-picker-select": "^8.0.4",     // Native dropdown picker
  "react-native-modal": "^13.0.1",            // Modal support
  "@react-native-async-storage/async-storage": "^1.21.0",  // Coin cache
  "fuse.js": "^7.0.0"                         // Fuzzy search for offline
}
```

### 3.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ AddItem      │───▶│ CoinSearch   │───▶│ PriceGuide   │  │
│  │ Screen       │    │ Hook         │    │ Hook         │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                     │          │
│         │                   ▼                     ▼          │
│         │            ┌──────────────┐    ┌──────────────┐  │
│         │            │ Coin Cache   │    │ Price Cache  │  │
│         │            │ (AsyncStore) │    │ (AsyncStore) │  │
│         │            └──────────────┘    └──────────────┘  │
│         │                   │                     │          │
│         └───────────────────┴─────────────────────┘          │
│                             │                                 │
│                             ▼                                 │
│                    ┌──────────────┐                          │
│                    │ API Client   │                          │
│                    └──────────────┘                          │
│                             │                                 │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              │ HTTPS
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                      Backend API (Web)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  /api/coins/search          - Coin reference search          │
│  /api/coins/price-guide     - Price guide lookup             │
│  /api/grades                - Valid grade list               │
│  /api/collection (POST)     - Create item                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  CoinReference     - 100 coin definitions                    │
│  CoinPriceGuide    - 3,100+ price entries                    │
│  ValidGrade        - 31 grade definitions                    │
│  CollectionItem    - User collection                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Offline Strategy

**Coin Search Offline:**
1. On app startup, fetch and cache all CoinReference records (~100 records)
2. Store in AsyncStorage with TTL of 7 days
3. Use Fuse.js for client-side fuzzy search
4. Sync in background when online

**Price Guide Offline:**
1. Cache recently accessed price guide data
2. LRU cache with max 500 entries
3. Show "Offline - using cached pricing" indicator
4. Queue updates when online

**Grade List Offline:**
1. Cache ValidGrade list on first fetch
2. Rarely changes, cache indefinitely
3. Refresh on app update

### 3.4 State Management

**Local State (useState):**
- Form inputs
- Modal visibility
- Step tracking in multi-step form

**Context/Global State:**
- Authentication
- Collection data
- Cached coin references
- Cached price guide data

**Server State (React Query equivalent):**
- Implement custom hook pattern similar to web
- Cache API responses
- Handle loading/error states
- Auto-refetch on focus

---

## 4. UI/UX Design for Mobile

### 4.1 Screen Modifications

#### 4.1.1 AddItemScreen Enhancement

**Current Flow:**
```
[Select Metal] → [Enter Details] → [Submit]
```

**New Flow:**
```
[Select Category: BULLION or NUMISMATIC]
      │
      ├─ BULLION → [Existing flow unchanged]
      │
      └─ NUMISMATIC → [Select Grading: RAW or GRADED]
                            │
                            ├─ RAW → [Search Coin] → [Select Grade] → [Value] → [Submit]
                            │
                            └─ GRADED → [Search Coin] → [Cert Number] → [Service] → [Grade] → [Submit]
```

**Design Principles:**
- Progressive disclosure (show only relevant fields)
- Large touch targets (min 44x44pt)
- Clear visual hierarchy
- Inline validation feedback
- Accessible color contrast

#### 4.1.2 CollectionScreen Enhancement

**Current View:**
```
┌─────────────────────────┐
│ Collection              │
├─────────────────────────┤
│ [Card: Silver Bar]      │
│ [Card: Gold Coin]       │
│ [Card: Silver Eagles]   │
└─────────────────────────┘
```

**Enhanced View:**
```
┌─────────────────────────┐
│ Collection       [Filter]│
├─────────────────────────┤
│ [Filter Chips]          │
│  [All] [Bullion]        │
│  [Numismatic] [Problem] │
├─────────────────────────┤
│ [Card: 1921 Morgan]     │
│  └─ NUMISMATIC badge    │
│                          │
│ [Card: Silver Bar]      │
│  └─ BULLION badge       │
│                          │
│ [Card: 1889-CC Morgan]  │
│  └─ NUMISMATIC badge    │
└─────────────────────────┘
```

### 4.2 Component Layouts

#### 4.2.1 Coin Search Component

```
┌───────────────────────────────────────┐
│ Search Coin                           │
│ ┌───────────────────────────────────┐ │
│ │ 🔍 e.g., 1921 morgan             │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌─────────────────────────────────┐  │
│ │ Selected: 1921 Morgan Dollar    │  │
│ │ PCGS# 7172           [Change] ─┤  │
│ └─────────────────────────────────┘  │
│                                       │
│ OR (when no selection)                │
│                                       │
│ ┌─────────────────────────────────┐  │
│ │ ▸ 1921 Morgan Dollar            │  │
│ │   PCGS# 7172                    │  │
│ ├─────────────────────────────────┤  │
│ │ ▸ 1921-D Morgan Dollar          │  │
│ │   PCGS# 7173                    │  │
│ ├─────────────────────────────────┤  │
│ │ ▸ 1921-S Morgan Dollar          │  │
│ │   PCGS# 7174                    │  │
│ └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

**Touch Interactions:**
- Tap result to select
- Tap "Change" button to clear selection
- Keyboard appears on search input focus
- Results scroll independently

#### 4.2.2 Grade Picker Component

```
┌───────────────────────────────────────┐
│ Grade                                 │
│ ┌───────────────────────────────────┐ │
│ │ MS-63 (Mint State)          ▼   │ │
│ └───────────────────────────────────┘ │
│                                       │
│ When expanded (Picker Modal):         │
│ ┌───────────────────────────────────┐ │
│ │ Good (G4)                         │ │
│ │ Very Good (VG8)                   │ │
│ │ Fine (F12)                        │ │
│ │ Very Fine (VF20, VF30)            │ │
│ │ Extremely Fine (XF40, XF45)       │ │
│ │ About Uncirculated (AU50-58)      │ │
│ │ ▸ Mint State (MS60-68) ◀──────── │ │
│ │ Proof (PR60-70)                   │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘
```

**Behavior:**
- Native picker on iOS (UIPickerView)
- Bottom sheet on Android
- Grouped by category for easy navigation
- Selected grade highlighted

#### 4.2.3 Value Display Component

```
┌───────────────────────────────────────┐
│ Value                                 │
│ ┌───────────────────────────────────┐ │
│ │ Auto-filled from Guide        ✓  │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ┌───────────────────────────────────┐ │
│ │ $ 230.00                          │ │
│ └───────────────────────────────────┘ │
│                                       │
│ ✓ Price from PCGS guide (1/6/2026)   │
│ Confidence: High ●●●○                │
│                                       │
│ [Use Custom Value]                    │
└───────────────────────────────────────┘
```

**States:**
- Loading: Show skeleton/spinner
- Auto-filled: Show checkmark + source
- Custom: Show input field
- No data: Show message + manual entry

#### 4.2.4 Collection Card (Numismatic)

```
┌─────────────────────────────────────┐
│ ┌─────┐  1921 Morgan Dollar        │
│ │     │  MS-63 (PCGS)               │
│ │ IMG │  NUMISMATIC                 │
│ │     │                              │
│ └─────┘  Book Value: $230.00        │
│          Melt Value: $88.00         │
│                                      │
│ [View Details] ──────────────────▸  │
└─────────────────────────────────────┘
```

**Elements:**
- Image thumbnail (if available)
- Auto-generated title
- Grade + Service badge
- Category badge
- Value comparison
- Touch area for details view

### 4.3 Color Palette & Visual Design

**Category Colors:**
```typescript
const CATEGORY_COLORS = {
  BULLION: {
    background: '#FEF3C7',    // Amber light
    border: '#F59E0B',        // Amber
    text: '#92400E',          // Amber dark
  },
  NUMISMATIC: {
    background: '#DBEAFE',    // Blue light
    border: '#3B82F6',        // Blue
    text: '#1E3A8A',          // Blue dark
  },
};
```

**Grading Service Colors:**
```typescript
const SERVICE_COLORS = {
  PCGS: '#E76F51',           // Coral (PCGS brand color)
  NGC: '#264653',            // Dark blue-gray (NGC brand color)
  RAW: '#6B7280',            // Gray
};
```

**Confidence Indicators:**
```typescript
const CONFIDENCE_COLORS = {
  high: '#22C55E',           // Green
  medium: '#EAB308',         // Yellow
  low: '#EF4444',            // Red
};
```

### 4.4 Accessibility Considerations

- **VoiceOver/TalkBack**: All interactive elements labeled
- **Dynamic Type**: Support iOS/Android text scaling
- **Color Contrast**: WCAG AA minimum (4.5:1 for text)
- **Touch Targets**: Minimum 44x44pt (iOS HIG)
- **Haptic Feedback**: Subtle feedback on selection
- **Screen Reader**: Descriptive labels for all inputs

---

## 5. Component Specifications

### 5.1 New Components to Create

#### 5.1.1 `CoinSearchInput.tsx`

**Purpose:** Search and select coin from reference database

**Props:**
```typescript
interface CoinSearchInputProps {
  onSelect: (coin: CoinReference) => void;
  selectedCoin: CoinReference | null;
  disabled?: boolean;
}
```

**Features:**
- Debounced search (300ms)
- Fuzzy matching
- Offline capability
- Clear selection button
- Loading state
- Empty state message

**Implementation Notes:**
- Use Fuse.js for fuzzy search
- Cache results in memory during session
- Show max 10 results to avoid scroll fatigue

#### 5.1.2 `GradePicker.tsx`

**Purpose:** Select coin grade from ValidGrade list

**Props:**
```typescript
interface GradePickerProps {
  value: string;
  onChange: (grade: string) => void;
  disabled?: boolean;
  isEstimated?: boolean;  // For RAW coins
}
```

**Features:**
- Native picker integration (iOS/Android)
- Grouped by category (Good, Fine, MS, Proof, etc.)
- Clear visual hierarchy
- Estimated grade toggle for RAW coins

**Implementation Notes:**
- Use `@react-native-picker/picker` for native feel
- Pre-load grades on app start
- Cache in AsyncStorage

#### 5.1.3 `PriceGuideDisplay.tsx`

**Purpose:** Show auto-filled price from guide with confidence

**Props:**
```typescript
interface PriceGuideDisplayProps {
  coinId: string;
  grade: string;
  onValueChange: (value: number) => void;
  allowCustom?: boolean;
}
```

**Features:**
- Auto-fetch on coinId + grade change
- Loading skeleton
- Confidence indicator (high/medium/low)
- Last updated date
- Toggle to custom value
- Offline indicator

**Implementation Notes:**
- Debounce API calls (500ms)
- Cache results for 1 hour
- Show stale data with warning if offline

#### 5.1.4 `CategoryBadge.tsx`

**Purpose:** Visual indicator for BULLION vs NUMISMATIC

**Props:**
```typescript
interface CategoryBadgeProps {
  category: 'BULLION' | 'NUMISMATIC';
  size?: 'sm' | 'md' | 'lg';
}
```

**Design:**
```
BULLION:    [🥇 BULLION]    Amber background
NUMISMATIC: [🪙 NUMISMATIC] Blue background
```

#### 5.1.5 `ProblemCoinBadge.tsx`

**Purpose:** Show problem coin indicator

**Props:**
```typescript
interface ProblemCoinBadgeProps {
  isProblem: boolean;
  problemType?: 'cleaned' | 'damaged' | 'holed' | 'repaired';
}
```

**Design:**
```
[⚠️ CLEANED]    Red background, white text
[⚠️ DAMAGED]    Orange background, white text
```

#### 5.1.6 `ConfidenceIndicator.tsx`

**Purpose:** Show price guide data confidence level

**Props:**
```typescript
interface ConfidenceIndicatorProps {
  level: 'high' | 'medium' | 'low';
  lastUpdated?: Date;
}
```

**Design:**
```
High:    ●●●○ (3/4 filled circles, green)
Medium:  ●●○○ (2/4 filled circles, yellow)
Low:     ●○○○ (1/4 filled circles, red)
```

### 5.2 Screen Updates

#### 5.2.1 `AddItemScreen.tsx` Refactor

**Current Structure:**
```typescript
// Simple single-screen form
const AddItemScreen = () => {
  return (
    <View>
      <MetalSelector />
      <Input name="title" />
      <Input name="quantity" />
      <Input name="weight" />
      <Button onPress={handleSubmit} />
    </View>
  );
};
```

**New Structure:**
```typescript
// Multi-step wizard
const AddItemScreen = () => {
  const [step, setStep] = useState<'category' | 'grading' | 'details'>('category');
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [gradingService, setGradingService] = useState<GradingService | null>(null);

  return (
    <View>
      {/* Progress Indicator */}
      <StepIndicator currentStep={step} />

      {/* Step 1: Category Selection */}
      {step === 'category' && (
        <CategorySelector
          onSelect={(cat) => {
            setCategory(cat);
            setStep(cat === 'NUMISMATIC' ? 'grading' : 'details');
          }}
        />
      )}

      {/* Step 2: Grading Type (Numismatic only) */}
      {step === 'grading' && category === 'NUMISMATIC' && (
        <GradingTypeSelector
          onSelect={(service) => {
            setGradingService(service);
            setStep('details');
          }}
        />
      )}

      {/* Step 3: Details Form */}
      {step === 'details' && (
        <ScrollView>
          {category === 'BULLION' ? (
            <BullionForm />  {/* Existing form */}
          ) : gradingService === 'RAW' ? (
            <RawCoinForm />  {/* New form */}
          ) : (
            <GradedCoinForm />  {/* New form */}
          )}
        </ScrollView>
      )}
    </View>
  );
};
```

**Key Changes:**
1. Add multi-step state management
2. Progressive disclosure of fields
3. Back button navigation between steps
4. Form validation per step
5. Auto-save draft to AsyncStorage

#### 5.2.2 `CollectionScreen.tsx` Enhancement

**Add Filter System:**
```typescript
const CollectionScreen = () => {
  const [filter, setFilter] = useState<'all' | 'bullion' | 'numismatic'>('all');
  const { data: items } = useCollection();

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items?.filter(item =>
      filter === 'bullion'
        ? item.category === 'BULLION'
        : item.category === 'NUMISMATIC'
    );
  }, [items, filter]);

  return (
    <View>
      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label="Bullion" active={filter === 'bullion'} onPress={() => setFilter('bullion')} />
        <FilterChip label="Numismatic" active={filter === 'numismatic'} onPress={() => setFilter('numismatic')} />
      </ScrollView>

      {/* Collection List */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <CollectionCard item={item} />}
        keyExtractor={item => item.id}
      />
    </View>
  );
};
```

**Update CollectionCard:**
```typescript
const CollectionCard = ({ item }: { item: CollectionItem }) => {
  const displayTitle = item.category === 'NUMISMATIC'
    ? item.title  // Auto-generated title
    : item.type === 'itemized'
      ? item.title
      : `${item.metal.toUpperCase()} (Bulk)`;

  const displayValue = item.category === 'NUMISMATIC'
    ? item.numismaticValue
    : calculateCurrentBookValue(item, currentSpotPrice);

  return (
    <TouchableOpacity onPress={() => navigate('ItemDetail', { id: item.id })}>
      <View style={styles.card}>
        {/* Image */}
        {item.images?.[0] && <Image source={{ uri: item.images[0] }} />}

        {/* Content */}
        <View>
          <Text style={styles.title}>{displayTitle}</Text>

          {/* Category Badge */}
          <CategoryBadge category={item.category} />

          {/* Grade (if numismatic) */}
          {item.category === 'NUMISMATIC' && (
            <Text style={styles.grade}>
              {item.gradingService === 'RAW' ? '~' : ''}{item.grade}
              ({item.gradingService})
            </Text>
          )}

          {/* Problem Badge */}
          {item.isProblemCoin && (
            <ProblemCoinBadge isProblem problemType={item.problemType} />
          )}

          {/* Value */}
          <Text style={styles.value}>${displayValue.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
```

#### 5.2.3 `DashboardScreen.tsx` Enhancement

**Update Summary Calculation:**
```typescript
const DashboardScreen = () => {
  const { data: summary } = useCollectionSummary();

  // Now includes numismatic breakdown
  const totalValue = summary?.totalValue || 0;
  const bullionValue = summary?.bullionValue || 0;
  const numismaticValue = summary?.numismaticValue || 0;

  return (
    <ScrollView>
      {/* Total Value Card */}
      <Card>
        <Text>Total Portfolio Value</Text>
        <Text style={styles.largeValue}>${totalValue.toLocaleString()}</Text>
      </Card>

      {/* Breakdown */}
      <Card>
        <Text>Bullion: ${bullionValue.toLocaleString()}</Text>
        <Text>Numismatic: ${numismaticValue.toLocaleString()}</Text>
      </Card>

      {/* Charts (existing) */}
      <PortfolioChart />
      <AllocationDonutChart />
    </ScrollView>
  );
};
```

---

## 6. API Integration

### 6.1 API Client Extensions

**File:** `src/lib/api.ts`

**Add New Endpoints:**

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ===== COIN SEARCH =====

export interface CoinReference {
  id: string;
  pcgsNumber: string;
  fullName: string;
  series: string;
  year: number;
  mintMark: string | null;
  denomination: string;
  metal: string;
  weightOz: number | null;
}

/**
 * Search coin references by query string
 * Caches results for offline access
 */
export async function searchCoins(query: string): Promise<CoinReference[]> {
  try {
    const response = await api.get('/api/coins/search', {
      params: { q: query, limit: 10 },
    });
    return response.data.data || [];
  } catch (error) {
    // Fallback to cached results if offline
    const cached = await getCachedCoins();
    if (cached) {
      // Client-side fuzzy search using Fuse.js
      return fuzzySearchCoins(cached, query);
    }
    throw error;
  }
}

/**
 * Get all coins and cache locally
 * Call on app startup for offline capability
 */
export async function syncCoinsCache(): Promise<void> {
  try {
    const response = await api.get('/api/coins/search', {
      params: { q: '', limit: 1000 },  // Get all
    });
    const coins = response.data.data || [];
    await AsyncStorage.setItem('coins_cache', JSON.stringify(coins));
    await AsyncStorage.setItem('coins_cache_timestamp', Date.now().toString());
  } catch (error) {
    console.error('Failed to sync coins cache:', error);
  }
}

async function getCachedCoins(): Promise<CoinReference[] | null> {
  try {
    const cached = await AsyncStorage.getItem('coins_cache');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function fuzzySearchCoins(coins: CoinReference[], query: string): CoinReference[] {
  const Fuse = require('fuse.js');
  const fuse = new Fuse(coins, {
    keys: ['fullName', 'series', 'year', 'pcgsNumber'],
    threshold: 0.3,
  });
  return fuse.search(query).map((result: any) => result.item).slice(0, 10);
}

// ===== PRICE GUIDE =====

export interface PriceGuideData {
  price: number | null;
  priceDate: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

/**
 * Fetch price guide data for coin + grade
 * Caches results for 1 hour
 */
export async function getPriceGuide(
  coinReferenceId: string,
  grade: string
): Promise<PriceGuideData | null> {
  const cacheKey = `price_${coinReferenceId}_${grade}`;

  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      if (age < 3600000) {  // 1 hour
        return data;
      }
    }

    // Fetch from API
    const response = await api.get('/api/coins/price-guide', {
      params: { coinReferenceId, grade },
    });

    const data = response.data.data;

    // Cache result
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));

    return data;
  } catch (error) {
    console.error('Failed to fetch price guide:', error);

    // Return stale cache if available
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const { data } = JSON.parse(cached);
      return { ...data, isStale: true };
    }

    return null;
  }
}

// ===== GRADES =====

export interface ValidGrade {
  gradeCode: string;
  numericValue: number;
  gradeCategory: string;
  displayOrder: number;
}

/**
 * Get all valid grades
 * Caches indefinitely (rarely changes)
 */
export async function getGrades(): Promise<ValidGrade[]> {
  const cacheKey = 'grades_cache';

  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from API
    const response = await api.get('/api/grades');
    const grades = response.data.data || [];

    // Cache indefinitely
    await AsyncStorage.setItem(cacheKey, JSON.stringify(grades));

    return grades;
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    return [];
  }
}

// ===== COLLECTION (ENHANCED) =====

export interface CreateCollectionItemRequest {
  category: 'BULLION' | 'NUMISMATIC';
  purchaseDate: string;
  notes?: string;
  images?: string[];

  // Bullion fields
  type?: 'itemized' | 'bulk';
  title?: string;
  metal?: string;
  quantity?: number;
  weightOz?: number;
  bookValueType?: 'spot' | 'custom' | 'numismatic';
  customBookValue?: number;

  // Numismatic fields
  coinReferenceId?: string;
  grade?: string;
  gradingService?: 'PCGS' | 'NGC' | 'RAW';
  certificationNumber?: string;
  isGradeEstimated?: boolean;
  isProblemCoin?: boolean;
  problemType?: 'cleaned' | 'damaged' | 'holed' | 'repaired';
  numismaticValue?: number;
}

/**
 * Create collection item (bullion or numismatic)
 */
export async function createCollectionItem(
  data: CreateCollectionItemRequest
): Promise<CollectionItem> {
  const response = await api.post('/api/collection', data);
  return response.data.data;
}

// ===== COLLECTION SUMMARY (NEW) =====

export interface CollectionSummary {
  totalValue: number;
  bullionValue: number;
  numismaticValue: number;
  totalItems: number;
  bullionItems: number;
  numismaticItems: number;
}

/**
 * Get collection summary with category breakdown
 */
export async function getCollectionSummary(): Promise<CollectionSummary> {
  const response = await api.get('/api/collection/summary');
  return response.data.data;
}
```

### 6.2 React Hooks

**File:** `src/hooks/useCoins.ts`

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import * as api from '@/lib/api';

/**
 * Search coins with debouncing
 */
export function useCoinSearch(query: string) {
  return useQuery({
    queryKey: ['coins', 'search', query],
    queryFn: () => api.searchCoins(query),
    enabled: query.length >= 2,
    staleTime: 300000,  // 5 minutes
  });
}

/**
 * Fetch price guide for coin + grade
 */
export function usePriceGuide(coinId: string | null, grade: string | null) {
  return useQuery({
    queryKey: ['priceGuide', coinId, grade],
    queryFn: () => {
      if (!coinId || !grade) return null;
      return api.getPriceGuide(coinId, grade);
    },
    enabled: !!coinId && !!grade,
    staleTime: 3600000,  // 1 hour
  });
}

/**
 * Fetch all valid grades
 */
export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: api.getGrades,
    staleTime: Infinity,  // Never refetch
  });
}

/**
 * Get collection summary
 */
export function useCollectionSummary() {
  return useQuery({
    queryKey: ['collection', 'summary'],
    queryFn: api.getCollectionSummary,
    staleTime: 60000,  // 1 minute
  });
}
```

---

## 7. Data Models

### 7.1 TypeScript Interfaces

**File:** `src/types/index.ts`

**Add/Update:**

```typescript
// ===== COIN REFERENCE =====

export interface CoinReference {
  id: string;
  pcgsNumber: string;
  fullName: string;
  series: string;
  year: number;
  mintMark: string | null;
  denomination: string;
  metal: string;
  weightOz: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ===== VALID GRADE =====

export interface ValidGrade {
  gradeCode: string;
  numericValue: number;
  gradeCategory: string;
  displayOrder: number;
}

// ===== PRICE GUIDE =====

export interface PriceGuideData {
  price: number | null;
  priceDate: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  isStale?: boolean;  // If from cache and offline
}

// ===== COLLECTION ITEM (ENHANCED) =====

export type ItemCategory = 'BULLION' | 'NUMISMATIC';
export type GradingService = 'PCGS' | 'NGC' | 'RAW';
export type ProblemType = 'cleaned' | 'damaged' | 'holed' | 'repaired';

export interface CollectionItem {
  id: string;
  userId: string;
  category: ItemCategory;

  // Common fields
  purchaseDate: Date;
  notes?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;

  // Bullion fields (existing)
  type?: 'itemized' | 'bulk';
  title?: string;
  metal?: string;
  quantity?: number;
  weightOz?: number;
  bookValueType?: 'spot' | 'custom' | 'numismatic';
  customBookValue?: number;

  // Numismatic fields (new)
  coinReferenceId?: string;
  coinReference?: CoinReference;  // Populated relation
  grade?: string;
  gradingService?: GradingService;
  certificationNumber?: string;
  isGradeEstimated?: boolean;
  isProblemCoin?: boolean;
  problemType?: ProblemType;
  numismaticValue?: number;
}

// ===== COLLECTION SUMMARY =====

export interface CollectionSummary {
  totalValue: number;
  bullionValue: number;
  numismaticValue: number;
  totalItems: number;
  bullionItems: number;
  numismaticItems: number;
  byMetal: {
    [metal: string]: {
      weightOz: number;
      value: number;
      items: number;
    };
  };
}
```

### 7.2 Local Storage Schema

**AsyncStorage Keys:**

```typescript
// Coin cache
'coins_cache'              // CoinReference[]
'coins_cache_timestamp'    // number

// Price guide cache (per coin+grade)
'price_{coinId}_{grade}'   // { data: PriceGuideData, timestamp: number }

// Grades cache
'grades_cache'             // ValidGrade[]

// Draft forms (auto-save)
'draft_add_item'           // Partial<CreateCollectionItemRequest>
```

**Cache Management:**

```typescript
// Clear old price caches (run on app start)
async function clearOldPriceCaches() {
  const keys = await AsyncStorage.getAllKeys();
  const priceKeys = keys.filter(k => k.startsWith('price_'));

  for (const key of priceKeys) {
    const item = await AsyncStorage.getItem(key);
    if (item) {
      const { timestamp } = JSON.parse(item);
      const age = Date.now() - timestamp;
      if (age > 86400000) {  // 24 hours
        await AsyncStorage.removeItem(key);
      }
    }
  }
}
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up data layer and API integration

**Tasks:**
- [ ] Add dependencies (`fuse.js`, `react-native-modal`, etc.)
- [ ] Create TypeScript interfaces in `src/types/index.ts`
- [ ] Extend API client in `src/lib/api.ts`
  - [ ] `searchCoins()`
  - [ ] `getPriceGuide()`
  - [ ] `getGrades()`
  - [ ] `syncCoinsCache()`
- [ ] Create React hooks in `src/hooks/useCoins.ts`
  - [ ] `useCoinSearch()`
  - [ ] `usePriceGuide()`
  - [ ] `useGrades()`
  - [ ] `useCollectionSummary()`
- [ ] Implement offline caching strategy
- [ ] Add cache management utilities

**Testing:**
- Unit tests for API functions
- Test offline fallback
- Test cache expiration

**Deliverables:**
- Working API integration
- Offline coin search functional
- Cache system operational

---

### Phase 2: UI Components (Week 3-4)

**Goal:** Build reusable numismatic components

**Tasks:**
- [ ] Create `CoinSearchInput.tsx`
  - [ ] Search input with debounce
  - [ ] Results list
  - [ ] Selected coin display
  - [ ] Change button
- [ ] Create `GradePicker.tsx`
  - [ ] Native picker integration
  - [ ] Grouped grades by category
  - [ ] Estimated grade toggle
- [ ] Create `PriceGuideDisplay.tsx`
  - [ ] Auto-fetch on coin+grade change
  - [ ] Loading skeleton
  - [ ] Confidence indicator
  - [ ] Custom value toggle
- [ ] Create `CategoryBadge.tsx`
- [ ] Create `ProblemCoinBadge.tsx`
- [ ] Create `ConfidenceIndicator.tsx`

**Testing:**
- Component snapshot tests
- Accessibility tests (VoiceOver/TalkBack)
- Touch target size validation

**Deliverables:**
- 6 new components fully tested
- Storybook examples (if using)
- Accessibility audit passed

---

### Phase 3: AddItemScreen Refactor (Week 5-6)

**Goal:** Implement multi-step numismatic entry flow

**Tasks:**
- [ ] Refactor `AddItemScreen.tsx` to multi-step wizard
- [ ] Create `CategorySelector` component
- [ ] Create `GradingTypeSelector` component
- [ ] Create `RawCoinForm` component
  - [ ] Coin search
  - [ ] Metal type selector
  - [ ] Grade picker
  - [ ] Estimated grade toggle
  - [ ] Problem coin fields
  - [ ] Value display with auto-fill
- [ ] Create `GradedCoinForm` component
  - [ ] Coin search
  - [ ] Certification number input
  - [ ] Grading service selector (PCGS/NGC)
  - [ ] Grade picker
  - [ ] Problem coin fields
  - [ ] Value display with auto-fill
- [ ] Add step progress indicator
- [ ] Add back button navigation
- [ ] Implement form validation per step
- [ ] Add draft auto-save to AsyncStorage

**Testing:**
- End-to-end flow tests
- Form validation tests
- Navigation tests
- Draft save/restore tests

**Deliverables:**
- Fully functional multi-step form
- RAW and GRADED workflows complete
- Auto-save working

---

### Phase 4: Collection Display (Week 7-8)

**Goal:** Update collection screens to show numismatic items

**Tasks:**
- [ ] Update `CollectionCard.tsx`
  - [ ] Add category badge
  - [ ] Show grade + service
  - [ ] Show problem badge
  - [ ] Update title display logic
  - [ ] Update value display logic
- [ ] Update `CollectionScreen.tsx`
  - [ ] Add filter chips (All/Bullion/Numismatic)
  - [ ] Update filtering logic
  - [ ] Add sort options (by value, date, category)
- [ ] Update `DashboardScreen.tsx`
  - [ ] Show category breakdown in summary
  - [ ] Update total value calculation
- [ ] Create `ItemDetailScreen.tsx` (new)
  - [ ] Full item details view
  - [ ] Image gallery
  - [ ] Edit/Delete actions
  - [ ] Certification lookup (PCGS/NGC verify)

**Testing:**
- UI tests for filters
- Value calculation tests
- Sort functionality tests

**Deliverables:**
- Collection display shows numismatics
- Filtering works correctly
- Detail screen functional

---

### Phase 5: Polish & Optimization (Week 9-10)

**Goal:** Performance tuning and UX improvements

**Tasks:**
- [ ] Optimize list rendering (FlatList virtualization)
- [ ] Add image optimization/compression
- [ ] Implement pull-to-refresh on collection
- [ ] Add haptic feedback on selections
- [ ] Add loading skeletons for all async states
- [ ] Improve error messages and empty states
- [ ] Add onboarding tutorial for numismatics
- [ ] Performance profiling (React DevTools)
- [ ] Accessibility audit (screen reader testing)
- [ ] Dark mode support (if not already implemented)

**Testing:**
- Performance benchmarks
- Accessibility testing
- Cross-device testing (iOS/Android)
- Tablet layout testing

**Deliverables:**
- 60 FPS scrolling
- All loading states polished
- Accessibility score > 90%

---

### Phase 6: Testing & Documentation (Week 11-12)

**Goal:** Comprehensive testing and user documentation

**Tasks:**
- [ ] Write integration tests
- [ ] End-to-end testing (Detox or Maestro)
- [ ] Beta testing with 5-10 users
- [ ] Bug fixes from beta feedback
- [ ] Update README with numismatics features
- [ ] Create user guide (in-app help)
- [ ] Record demo video
- [ ] Prepare App Store/Play Store screenshots

**Testing:**
- Full regression suite
- Beta user feedback collection

**Deliverables:**
- Test coverage > 80%
- Zero critical bugs
- User documentation complete
- App store assets ready

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Tools:** Jest, React Native Testing Library

**Coverage Areas:**
- API functions (`api.ts`)
- Utility functions (cache management, fuzzy search)
- Hooks (mock API responses)
- Value calculations

**Example:**
```typescript
// src/lib/__tests__/api.test.ts
describe('searchCoins', () => {
  it('should return coins matching query', async () => {
    const results = await searchCoins('1921 morgan');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].fullName).toContain('Morgan');
  });

  it('should fall back to cache when offline', async () => {
    // Mock network failure
    // Verify cache is used
  });
});
```

### 9.2 Component Tests

**Tools:** React Native Testing Library

**Coverage Areas:**
- Component rendering
- User interactions (tap, type, scroll)
- Conditional rendering
- Accessibility props

**Example:**
```typescript
// src/components/__tests__/CoinSearchInput.test.tsx
describe('CoinSearchInput', () => {
  it('should show results when typing', async () => {
    const onSelect = jest.fn();
    const { getByPlaceholderText, findByText } = render(
      <CoinSearchInput onSelect={onSelect} selectedCoin={null} />
    );

    const input = getByPlaceholderText('e.g., 1921 morgan');
    fireEvent.changeText(input, '1921');

    const result = await findByText('1921 Morgan Dollar');
    expect(result).toBeTruthy();
  });
});
```

### 9.3 Integration Tests

**Tools:** React Native Testing Library, Mock Service Worker

**Coverage Areas:**
- Multi-step form flows
- API integration with mocked responses
- Navigation between screens
- Cache interactions

### 9.4 End-to-End Tests

**Tools:** Detox or Maestro

**Coverage Areas:**
- Complete user flows (add numismatic item, view collection, etc.)
- Cross-screen navigation
- Real API calls (test environment)

**Example Flow:**
```
1. Launch app
2. Navigate to Add Item
3. Select "Numismatic"
4. Select "RAW"
5. Search for "1921 morgan"
6. Select first result
7. Select grade "MS-63"
8. Verify auto-filled value
9. Submit form
10. Verify item appears in collection
11. Verify summary updated
```

### 9.5 Manual Testing Checklist

**Accessibility:**
- [ ] VoiceOver (iOS) - all screens navigable
- [ ] TalkBack (Android) - all screens navigable
- [ ] Dynamic Type - text scales correctly
- [ ] Color contrast - passes WCAG AA

**Performance:**
- [ ] Collection with 100+ items scrolls smoothly
- [ ] Image loading doesn't block UI
- [ ] Search responds in < 500ms
- [ ] No memory leaks

**Offline:**
- [ ] Coin search works offline
- [ ] Price guide shows stale data with warning
- [ ] Submit queues for when online
- [ ] Graceful error messages

**Cross-Platform:**
- [ ] iOS (iPhone 12+, iOS 15+)
- [ ] Android (Pixel, Samsung, Android 11+)
- [ ] Tablet layouts (iPad, Android tablets)

---

## 10. Deployment Considerations

### 10.1 Environment Variables

**File:** `.env`

```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.bulliontracker.com

# Feature Flags
EXPO_PUBLIC_ENABLE_NUMISMATICS=true
EXPO_PUBLIC_OFFLINE_MODE=true

# Cache TTLs (milliseconds)
EXPO_PUBLIC_COIN_CACHE_TTL=604800000     # 7 days
EXPO_PUBLIC_PRICE_CACHE_TTL=3600000      # 1 hour
```

### 10.2 App Store Submission

**iOS (App Store):**
- Update app description to mention numismatics
- Add screenshots of new numismatic features
- Update version number (e.g., 1.1.0)
- Submit for review

**Android (Play Store):**
- Update app description
- Add feature graphic with numismatics
- Update version code and version name
- Submit to production track

### 10.3 Rollout Strategy

**Phase 1: Internal Testing**
- Deploy to TestFlight (iOS)
- Deploy to Internal Testing (Android)
- Test with 5-10 internal users
- Fix critical bugs

**Phase 2: Beta Release**
- Open beta via TestFlight/Play Store Beta
- Collect feedback via in-app form
- Monitor crash reports (Sentry/Crashlytics)
- Iterate on feedback

**Phase 3: Staged Rollout**
- Release to 10% of users (Play Store staged rollout)
- Monitor metrics (adoption, errors, performance)
- Increase to 50%, then 100%

**Phase 4: Full Release**
- Announce on website/social media
- Update marketing materials
- Monitor support channels for issues

### 10.4 Monitoring & Analytics

**Metrics to Track:**
- Numismatic adoption rate (% of users adding numismatic items)
- Average items per user (bullion vs numismatic)
- Price guide API success rate
- Search performance (avg response time)
- Crash-free rate (should stay > 99%)
- Feature usage (RAW vs GRADED coins)

**Tools:**
- Firebase Analytics
- Sentry for error tracking
- Custom logging for API failures

### 10.5 Migration Notes

**No database migration required** - the backend already supports numismatics. Mobile app is purely additive.

**User Communication:**
- Push notification: "New feature: Track your coin collection!"
- In-app banner on first launch post-update
- Tutorial overlay showing new "Numismatic" option

---

## 11. Risks & Mitigation

### 11.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Offline mode not working | Medium | High | Extensive offline testing, fallback to online-only mode |
| Performance issues with large collections | Medium | Medium | Virtualized lists, pagination, lazy loading |
| API breaking changes | Low | High | Versioned API, backward compatibility |
| Native picker inconsistencies | Medium | Low | Custom picker fallback |

### 11.2 UX Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Multi-step form too complex | Medium | High | User testing, simplify flow, add help text |
| Search not finding coins | Medium | High | Fuzzy search, show "no results" help, report issue button |
| Confusing grade selection | Medium | Medium | Grouped picker, visual examples, help overlay |

### 11.3 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low adoption of numismatics | Medium | Medium | Marketing campaign, in-app education, user incentives |
| Support burden increases | High | Medium | Comprehensive FAQ, in-app help, video tutorials |

---

## 12. Success Metrics

### 12.1 KPIs

**Adoption:**
- 30% of active users add at least 1 numismatic item within 30 days
- Average 5 numismatic items per user by 90 days

**Engagement:**
- Time spent in app increases by 20%
- Collection views per session increases by 15%

**Technical:**
- Crash-free rate remains > 99%
- API response time < 500ms p95
- Offline mode works for 95% of users

**Satisfaction:**
- App Store rating maintains > 4.5 stars
- Positive feedback mentions "coins" or "numismatics" in 40% of reviews

---

## Appendix A: Component Hierarchy

```
App
├─ Navigation
│  ├─ DashboardScreen
│  │  ├─ PortfolioChart (updated)
│  │  ├─ AllocationDonutChart
│  │  └─ SummaryCard (updated)
│  │
│  ├─ CollectionScreen (updated)
│  │  ├─ FilterChips (new)
│  │  ├─ CollectionCard (updated)
│  │  │  ├─ CategoryBadge (new)
│  │  │  ├─ ProblemCoinBadge (new)
│  │  │  └─ Image
│  │  └─ FlatList
│  │
│  ├─ AddItemScreen (refactored)
│  │  ├─ StepIndicator (new)
│  │  ├─ CategorySelector (new)
│  │  ├─ GradingTypeSelector (new)
│  │  ├─ RawCoinForm (new)
│  │  │  ├─ CoinSearchInput (new)
│  │  │  ├─ MetalSelector
│  │  │  ├─ GradePicker (new)
│  │  │  ├─ ProblemCoinToggle (new)
│  │  │  ├─ PriceGuideDisplay (new)
│  │  │  │  └─ ConfidenceIndicator (new)
│  │  │  └─ ImageUploader
│  │  └─ GradedCoinForm (new)
│  │     ├─ CoinSearchInput (new)
│  │     ├─ CertNumberInput (new)
│  │     ├─ ServiceSelector (new)
│  │     ├─ GradePicker (new)
│  │     ├─ ProblemCoinToggle (new)
│  │     ├─ PriceGuideDisplay (new)
│  │     └─ ImageUploader
│  │
│  └─ ItemDetailScreen (new)
│     ├─ ImageGallery
│     ├─ ItemInfo
│     ├─ CategoryBadge (new)
│     ├─ ProblemCoinBadge (new)
│     └─ ActionButtons
│
└─ Modals
   ├─ GradePickerModal (new)
   └─ ImageViewerModal
```

---

## Appendix B: API Endpoints Reference

```
GET  /api/coins/search
     ?q=1921+morgan&limit=10

     Response:
     {
       "success": true,
       "data": [
         {
           "id": "uuid",
           "pcgsNumber": "7172",
           "fullName": "1921 Morgan Dollar",
           "series": "Morgan Dollars",
           "year": 1921,
           "mintMark": null,
           "denomination": "1 Dollar",
           "metal": "silver",
           "weightOz": 0.7734
         }
       ]
     }

GET  /api/coins/price-guide
     ?coinReferenceId=uuid&grade=MS63

     Response:
     {
       "success": true,
       "data": {
         "price": 230.00,
         "priceDate": "2026-01-06T00:00:00Z",
         "confidenceLevel": "high"
       }
     }

GET  /api/grades

     Response:
     {
       "success": true,
       "data": [
         {
           "gradeCode": "MS63",
           "numericValue": 63,
           "gradeCategory": "Mint State",
           "displayOrder": 63
         }
       ]
     }

POST /api/collection

     Request:
     {
       "category": "NUMISMATIC",
       "coinReferenceId": "uuid",
       "grade": "MS63",
       "gradingService": "RAW",
       "isGradeEstimated": true,
       "isProblemCoin": false,
       "numismaticValue": 230.00,
       "purchaseDate": "2026-01-06",
       "metal": "silver",
       "images": []
     }

     Response:
     {
       "success": true,
       "data": { /* CollectionItem */ }
     }

GET  /api/collection/summary

     Response:
     {
       "success": true,
       "data": {
         "totalValue": 5000.00,
         "bullionValue": 3000.00,
         "numismaticValue": 2000.00,
         "totalItems": 25,
         "bullionItems": 15,
         "numismaticItems": 10
       }
     }
```

---

## Appendix C: Database Schema (Reference)

**CoinReference:**
```sql
CREATE TABLE "CoinReference" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "pcgsNumber" TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  "series" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "mintMark" TEXT,
  "denomination" TEXT NOT NULL,
  "metal" TEXT NOT NULL,
  "weightOz" DECIMAL(10, 4),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coin_series ON "CoinReference"("series");
CREATE INDEX idx_coin_year ON "CoinReference"("year");
```

**CoinPriceGuide:**
```sql
CREATE TABLE "CoinPriceGuide" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "coinReferenceId" UUID NOT NULL REFERENCES "CoinReference"("id"),
  "gradeCode" TEXT NOT NULL,
  "pcgsPrice" DECIMAL(10, 2),
  "priceDate" DATE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("coinReferenceId", "gradeCode", "priceDate")
);

CREATE INDEX idx_price_coin_grade ON "CoinPriceGuide"("coinReferenceId", "gradeCode");
```

**ValidGrade:**
```sql
CREATE TABLE "ValidGrade" (
  "gradeCode" TEXT PRIMARY KEY,
  "numericValue" INTEGER NOT NULL,
  "gradeCategory" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL
);
```

**CollectionItem (Enhanced):**
```sql
CREATE TABLE "CollectionItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "category" TEXT NOT NULL CHECK ("category" IN ('BULLION', 'NUMISMATIC')),

  -- Common
  "purchaseDate" DATE NOT NULL,
  "notes" TEXT,
  "images" TEXT[],

  -- Bullion
  "type" TEXT CHECK ("type" IN ('itemized', 'bulk')),
  "title" TEXT,
  "metal" TEXT,
  "quantity" INTEGER,
  "weightOz" DECIMAL(10, 4),
  "bookValueType" TEXT CHECK ("bookValueType" IN ('spot', 'custom', 'numismatic')),
  "customBookValue" DECIMAL(10, 2),

  -- Numismatic
  "coinReferenceId" UUID REFERENCES "CoinReference"("id"),
  "grade" TEXT,
  "gradingService" TEXT CHECK ("gradingService" IN ('PCGS', 'NGC', 'RAW')),
  "certificationNumber" TEXT,
  "isGradeEstimated" BOOLEAN DEFAULT FALSE,
  "isProblemCoin" BOOLEAN DEFAULT FALSE,
  "problemType" TEXT CHECK ("problemType" IN ('cleaned', 'damaged', 'holed', 'repaired')),
  "numismaticValue" DECIMAL(10, 2),

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collection_user ON "CollectionItem"("userId");
CREATE INDEX idx_collection_category ON "CollectionItem"("category");
```

---

## Document Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-06 | Claude Sonnet 4.5 | Initial document creation |

---

**End of Document**
