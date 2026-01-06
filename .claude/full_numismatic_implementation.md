# Claude Code Implementation Prompt: Coin Tracker Feature

## Project Overview

Build a numismatic coin tracking feature for my existing Bullion Collection Tracker. This will extend the platform to support both bullion (valued by melt) and numismatic coins (valued by rarity, grade, and recent sales).

## Current Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Inline styles matching existing design system (see Design System section)
- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Already implemented
- **Existing Features**: Bullion tracking, spot price fetching, portfolio history, Plaid/Monarch integration endpoints

## Design System (MUST MATCH EXACTLY)

```typescript
// Colors
const colors = {
  background: '#F8F7F4',
  cardBackground: 'white',
  text: '#1a1a1a',
  textSecondary: '#666',
  textMuted: '#888',
  border: '#E0E0E0',
  borderLight: '#F5F5F5',
  goldAccent: '#D4AF37',
  silver: '#A8A8A8',
  platinum: '#E5E4E2',
  green: '#22A06B',
  red: '#E53935',
  blue: '#3B82F6',
};

// Card style
const cardStyle = {
  background: 'white',
  borderRadius: '20px',
  padding: '28px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

// Label style (uppercase headers)
const labelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

// Font
fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

// Monospace for numbers
fontFamily: 'monospace'
```

## What Needs to Be Built

### Phase 1: Database Schema

Create these new tables (add to existing database):

```sql
-- Coin reference data (populated by scraper)
CREATE TABLE coin_references (
    id SERIAL PRIMARY KEY,
    pcgs_number INTEGER UNIQUE NOT NULL,
    ngc_number INTEGER,
    year INTEGER NOT NULL,
    mint_mark VARCHAR(5),
    denomination VARCHAR(50) NOT NULL,
    series VARCHAR(100) NOT NULL,
    variety VARCHAR(200),
    metal VARCHAR(20),
    weight_oz DECIMAL(10, 4),
    fineness DECIMAL(5, 4),
    mintage INTEGER,
    full_name VARCHAR(300) NOT NULL,
    search_tokens TSVECTOR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coin_search ON coin_references USING GIN(search_tokens);
CREATE INDEX idx_coin_pcgs ON coin_references(pcgs_number);
CREATE INDEX idx_coin_series ON coin_references(series);

-- Valid grades lookup table
CREATE TABLE valid_grades (
    id SERIAL PRIMARY KEY,
    grade_code VARCHAR(10) UNIQUE NOT NULL,
    numeric_value INTEGER NOT NULL,
    grade_category VARCHAR(30) NOT NULL,
    display_order INTEGER NOT NULL
);

-- Price guide data (refreshed weekly)
CREATE TABLE coin_price_guide (
    id SERIAL PRIMARY KEY,
    coin_reference_id INTEGER REFERENCES coin_references(id) ON DELETE CASCADE,
    grade_code VARCHAR(10) REFERENCES valid_grades(grade_code),
    pcgs_price DECIMAL(12, 2),
    price_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(coin_reference_id, grade_code, price_date)
);

-- Recent sales data (refreshed weekly)
CREATE TABLE coin_sales (
    id SERIAL PRIMARY KEY,
    coin_reference_id INTEGER REFERENCES coin_references(id) ON DELETE CASCADE,
    grade_code VARCHAR(10),
    sale_price DECIMAL(12, 2) NOT NULL,
    sale_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL,
    source_url TEXT,
    cert_number VARCHAR(20),
    is_problem_coin BOOLEAN DEFAULT FALSE,
    problem_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sales_lookup ON coin_sales(coin_reference_id, grade_code, sale_date DESC);

-- Modify existing collection_items table OR create unified table
-- This replaces the old bullion-only table
CREATE TABLE collection_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Item classification
    item_category VARCHAR(20) NOT NULL CHECK (item_category IN ('BULLION', 'NUMISMATIC')),
    
    -- Common fields
    name VARCHAR(300) NOT NULL,
    purchase_price DECIMAL(12, 2),
    purchase_date DATE,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    images TEXT[],
    
    -- Bullion-specific (NULL for numismatic)
    metal VARCHAR(20),
    weight_oz DECIMAL(10, 4),
    fineness DECIMAL(5, 4),
    bullion_type VARCHAR(50),
    
    -- Numismatic-specific (NULL for bullion)
    coin_reference_id INTEGER REFERENCES coin_references(id),
    grading_service VARCHAR(10) CHECK (grading_service IN ('PCGS', 'NGC', 'RAW')),
    cert_number VARCHAR(20),
    grade_code VARCHAR(10) REFERENCES valid_grades(grade_code),
    is_grade_estimate BOOLEAN DEFAULT FALSE,
    is_problem_coin BOOLEAN DEFAULT FALSE,
    problem_type VARCHAR(50),
    
    -- Valuation
    valuation_method VARCHAR(20) NOT NULL CHECK (valuation_method IN ('melt', 'recent_sales', 'price_guide', 'custom')),
    custom_value DECIMAL(12, 2),
    calculated_value DECIMAL(12, 2),
    value_confidence VARCHAR(10) CHECK (value_confidence IN ('high', 'medium', 'low', 'user_defined')),
    last_valued_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collection_user ON collection_items(user_id);
CREATE INDEX idx_collection_category ON collection_items(item_category);
```

### Phase 2: Seed Valid Grades

```python
VALID_GRADES = [
    ('PO01', 1, 'Poor', 1),
    ('FR02', 2, 'Fair', 2),
    ('AG03', 3, 'About Good', 3),
    ('G04', 4, 'Good', 4),
    ('G06', 6, 'Good', 5),
    ('VG08', 8, 'Very Good', 6),
    ('VG10', 10, 'Very Good', 7),
    ('F12', 12, 'Fine', 8),
    ('F15', 15, 'Fine', 9),
    ('VF20', 20, 'Very Fine', 10),
    ('VF25', 25, 'Very Fine', 11),
    ('VF30', 30, 'Very Fine', 12),
    ('VF35', 35, 'Very Fine', 13),
    ('EF40', 40, 'Extremely Fine', 14),
    ('EF45', 45, 'Extremely Fine', 15),
    ('AU50', 50, 'About Uncirculated', 16),
    ('AU53', 53, 'About Uncirculated', 17),
    ('AU55', 55, 'About Uncirculated', 18),
    ('AU58', 58, 'About Uncirculated', 19),
    ('MS60', 60, 'Mint State', 20),
    ('MS61', 61, 'Mint State', 21),
    ('MS62', 62, 'Mint State', 22),
    ('MS63', 63, 'Mint State', 23),
    ('MS64', 64, 'Mint State', 24),
    ('MS65', 65, 'Mint State', 25),
    ('MS66', 66, 'Mint State', 26),
    ('MS67', 67, 'Mint State', 27),
    ('MS68', 68, 'Mint State', 28),
    ('MS69', 69, 'Mint State', 29),
    ('MS70', 70, 'Mint State', 30),
    ('PR60', 60, 'Proof', 31),
    ('PR61', 61, 'Proof', 32),
    ('PR62', 62, 'Proof', 33),
    ('PR63', 63, 'Proof', 34),
    ('PR64', 64, 'Proof', 35),
    ('PR65', 65, 'Proof', 36),
    ('PR66', 66, 'Proof', 37),
    ('PR67', 67, 'Proof', 38),
    ('PR68', 68, 'Proof', 39),
    ('PR69', 69, 'Proof', 40),
    ('PR70', 70, 'Proof', 41),
]
```

### Phase 3: Backend API Endpoints

#### SQLAlchemy Models

```python
# models/coin_reference.py
class CoinReference(Base):
    __tablename__ = 'coin_references'
    
    id = Column(Integer, primary_key=True)
    pcgs_number = Column(Integer, unique=True, nullable=False)
    ngc_number = Column(Integer)
    year = Column(Integer, nullable=False)
    mint_mark = Column(String(5))
    denomination = Column(String(50), nullable=False)
    series = Column(String(100), nullable=False)
    variety = Column(String(200))
    metal = Column(String(20))
    weight_oz = Column(Numeric(10, 4))
    fineness = Column(Numeric(5, 4))
    mintage = Column(Integer)
    full_name = Column(String(300), nullable=False)
    search_tokens = Column(TSVECTOR)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# models/collection_item.py
class CollectionItem(Base):
    __tablename__ = 'collection_items'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    item_category = Column(String(20), nullable=False)  # 'BULLION' or 'NUMISMATIC'
    name = Column(String(300), nullable=False)
    purchase_price = Column(Numeric(12, 2))
    purchase_date = Column(Date)
    quantity = Column(Integer, default=1)
    notes = Column(Text)
    images = Column(ARRAY(Text))
    
    # Bullion fields
    metal = Column(String(20))
    weight_oz = Column(Numeric(10, 4))
    fineness = Column(Numeric(5, 4))
    bullion_type = Column(String(50))
    
    # Numismatic fields
    coin_reference_id = Column(Integer, ForeignKey('coin_references.id'))
    grading_service = Column(String(10))
    cert_number = Column(String(20))
    grade_code = Column(String(10), ForeignKey('valid_grades.grade_code'))
    is_grade_estimate = Column(Boolean, default=False)
    is_problem_coin = Column(Boolean, default=False)
    problem_type = Column(String(50))
    
    # Valuation
    valuation_method = Column(String(20), nullable=False)
    custom_value = Column(Numeric(12, 2))
    calculated_value = Column(Numeric(12, 2))
    value_confidence = Column(String(10))
    last_valued_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    coin_reference = relationship("CoinReference")
    user = relationship("User")
```

#### API Endpoints

```python
# routers/coins.py

@router.get("/coins/search")
async def search_coins(q: str, limit: int = 10, db: Session = Depends(get_db)):
    """Full-text search for coin references"""
    query = db.query(CoinReference).filter(
        CoinReference.search_tokens.match(q)
    ).limit(limit)
    return query.all()

@router.get("/coins/{pcgs_number}")
async def get_coin(pcgs_number: int, db: Session = Depends(get_db)):
    """Get coin details by PCGS number"""
    coin = db.query(CoinReference).filter(
        CoinReference.pcgs_number == pcgs_number
    ).first()
    if not coin:
        raise HTTPException(404, "Coin not found")
    return coin

@router.get("/coins/cert/{cert_number}")
async def lookup_cert(cert_number: str, service: str = "PCGS"):
    """Lookup graded coin by certificate number (calls PCGS/NGC API or scrapes)"""
    # Implementation: scrape PCGS/NGC verification page
    # Return: coin details, grade, PCGS number
    pass

@router.get("/coins/{pcgs_number}/prices")
async def get_coin_prices(pcgs_number: int, db: Session = Depends(get_db)):
    """Get price guide for all grades"""
    coin = db.query(CoinReference).filter(
        CoinReference.pcgs_number == pcgs_number
    ).first()
    if not coin:
        raise HTTPException(404, "Coin not found")
    
    prices = db.query(CoinPriceGuide).filter(
        CoinPriceGuide.coin_reference_id == coin.id
    ).order_by(CoinPriceGuide.grade_code).all()
    
    return {"coin": coin, "prices": prices}

@router.get("/coins/{pcgs_number}/sales")
async def get_coin_sales(
    pcgs_number: int, 
    grade: str = None,
    days: int = 90,
    db: Session = Depends(get_db)
):
    """Get recent sales history"""
    coin = db.query(CoinReference).filter(
        CoinReference.pcgs_number == pcgs_number
    ).first()
    if not coin:
        raise HTTPException(404, "Coin not found")
    
    query = db.query(CoinSale).filter(
        CoinSale.coin_reference_id == coin.id,
        CoinSale.sale_date >= date.today() - timedelta(days=days),
        CoinSale.is_problem_coin == False
    )
    if grade:
        query = query.filter(CoinSale.grade_code == grade)
    
    return query.order_by(CoinSale.sale_date.desc()).all()

@router.get("/grades")
async def get_grades(db: Session = Depends(get_db)):
    """Get all valid grades grouped by category"""
    grades = db.query(ValidGrade).order_by(ValidGrade.display_order).all()
    
    # Group by category
    grouped = {}
    for grade in grades:
        if grade.grade_category not in grouped:
            grouped[grade.grade_category] = []
        grouped[grade.grade_category].append(grade)
    
    return grouped


# routers/collection.py

@router.get("/collection")
async def get_collection(
    category: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's collection with optional category filter"""
    query = db.query(CollectionItem).filter(
        CollectionItem.user_id == current_user.id
    )
    if category:
        query = query.filter(CollectionItem.item_category == category)
    
    return query.order_by(CollectionItem.created_at.desc()).all()

@router.post("/collection/bullion")
async def add_bullion(
    item: BullionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add bullion item"""
    # Calculate melt value
    spot_price = await get_spot_price(item.metal)
    melt_value = spot_price * item.weight_oz * item.fineness * item.quantity
    
    db_item = CollectionItem(
        user_id=current_user.id,
        item_category='BULLION',
        name=item.name,
        metal=item.metal,
        weight_oz=item.weight_oz,
        fineness=item.fineness,
        quantity=item.quantity,
        bullion_type=item.bullion_type,
        purchase_price=item.purchase_price,
        purchase_date=item.purchase_date,
        valuation_method='melt' if not item.custom_value else 'custom',
        custom_value=item.custom_value,
        calculated_value=melt_value,
        value_confidence='high',
        last_valued_at=datetime.utcnow(),
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/collection/numismatic")
async def add_numismatic(
    item: NumismaticCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add numismatic coin"""
    # Calculate value based on grade and recent sales
    value, confidence = await calculate_numismatic_value(
        db=db,
        coin_reference_id=item.coin_reference_id,
        grade_code=item.grade_code,
        grading_service=item.grading_service,
        is_grade_estimate=item.is_grade_estimate,
        is_problem_coin=item.is_problem_coin,
        problem_type=item.problem_type,
    )
    
    # Get coin reference for name
    coin_ref = db.query(CoinReference).get(item.coin_reference_id)
    name = f"{coin_ref.full_name} {item.grade_code}"
    if item.grading_service != 'RAW':
        name = f"{name} ({item.grading_service})"
    
    db_item = CollectionItem(
        user_id=current_user.id,
        item_category='NUMISMATIC',
        name=name,
        coin_reference_id=item.coin_reference_id,
        grading_service=item.grading_service,
        cert_number=item.cert_number,
        grade_code=item.grade_code,
        is_grade_estimate=item.is_grade_estimate,
        is_problem_coin=item.is_problem_coin,
        problem_type=item.problem_type,
        purchase_price=item.purchase_price,
        purchase_date=item.purchase_date,
        valuation_method='custom' if item.custom_value else 'recent_sales',
        custom_value=item.custom_value,
        calculated_value=item.custom_value or value,
        value_confidence='user_defined' if item.custom_value else confidence,
        last_valued_at=datetime.utcnow(),
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/collection/summary")
async def get_collection_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get portfolio summary with category breakdowns"""
    items = db.query(CollectionItem).filter(
        CollectionItem.user_id == current_user.id
    ).all()
    
    total_value = sum(
        (item.custom_value or item.calculated_value or 0) * (item.quantity or 1)
        for item in items
    )
    
    bullion_items = [i for i in items if i.item_category == 'BULLION']
    numismatic_items = [i for i in items if i.item_category == 'NUMISMATIC']
    
    bullion_value = sum(
        (i.custom_value or i.calculated_value or 0) * (i.quantity or 1)
        for i in bullion_items
    )
    numismatic_value = sum(
        (i.custom_value or i.calculated_value or 0) * (i.quantity or 1)
        for i in numismatic_items
    )
    
    # Bullion breakdown by metal
    bullion_by_metal = {}
    for item in bullion_items:
        metal = item.metal or 'Unknown'
        if metal not in bullion_by_metal:
            bullion_by_metal[metal] = {'value': 0, 'count': 0}
        bullion_by_metal[metal]['value'] += (item.custom_value or item.calculated_value or 0) * (item.quantity or 1)
        bullion_by_metal[metal]['count'] += item.quantity or 1
    
    # Numismatic breakdown by series (top 2 + others)
    numismatic_by_series = {}
    for item in numismatic_items:
        if item.coin_reference:
            series = item.coin_reference.series
        else:
            series = 'Unknown'
        if series not in numismatic_by_series:
            numismatic_by_series[series] = {'value': 0, 'count': 0}
        numismatic_by_series[series]['value'] += (item.custom_value or item.calculated_value or 0)
        numismatic_by_series[series]['count'] += 1
    
    # Sort and get top 2 + others
    sorted_series = sorted(numismatic_by_series.items(), key=lambda x: x[1]['value'], reverse=True)
    top_series = dict(sorted_series[:2])
    others = sorted_series[2:]
    if others:
        top_series['Others'] = {
            'value': sum(s[1]['value'] for s in others),
            'count': sum(s[1]['count'] for s in others),
        }
    
    return {
        'totalValue': total_value,
        'totalItems': len(items),
        'bullionValue': bullion_value,
        'bullionCount': len(bullion_items),
        'numismaticValue': numismatic_value,
        'numismaticCount': len(numismatic_items),
        'bullionByMetal': bullion_by_metal,
        'numismaticBySeries': top_series,
    }

@router.delete("/collection/{item_id}")
async def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete collection item"""
    item = db.query(CollectionItem).filter(
        CollectionItem.id == item_id,
        CollectionItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(404, "Item not found")
    
    db.delete(item)
    db.commit()
    return {"status": "deleted"}
```

### Phase 4: Valuation Engine

```python
# services/valuation.py

from decimal import Decimal
from datetime import date, timedelta
from statistics import median

PROBLEM_DISCOUNTS = {
    'cleaned': Decimal('0.50'),
    'environmental': Decimal('0.60'),
    'damaged': Decimal('0.40'),
    'questionable_toning': Decimal('0.70'),
    'other': Decimal('0.50'),
}

RAW_DISCOUNT = Decimal('0.85')

async def calculate_numismatic_value(
    db: Session,
    coin_reference_id: int,
    grade_code: str,
    grading_service: str,
    is_grade_estimate: bool = False,
    is_problem_coin: bool = False,
    problem_type: str = None,
) -> tuple[Decimal, str]:
    """
    Calculate value for a numismatic coin.
    Returns (value, confidence_level)
    """
    
    # Get base value first
    base_value, base_confidence = await _get_clean_coin_value(
        db, coin_reference_id, grade_code, grading_service, is_grade_estimate
    )
    
    # Apply problem coin discount
    if is_problem_coin:
        discount = PROBLEM_DISCOUNTS.get(problem_type, Decimal('0.50'))
        return base_value * discount, 'low'
    
    return base_value, base_confidence

async def _get_clean_coin_value(
    db: Session,
    coin_reference_id: int,
    grade_code: str,
    grading_service: str,
    is_grade_estimate: bool,
) -> tuple[Decimal, str]:
    """Calculate value for non-problem coins"""
    
    # Get recent sales (last 90 days, exclude problem coins)
    recent_sales = db.query(CoinSale).filter(
        CoinSale.coin_reference_id == coin_reference_id,
        CoinSale.grade_code == grade_code,
        CoinSale.sale_date >= date.today() - timedelta(days=90),
        CoinSale.is_problem_coin == False,
    ).all()
    
    sale_prices = [s.sale_price for s in recent_sales]
    
    # Get price guide
    price_guide = db.query(CoinPriceGuide).filter(
        CoinPriceGuide.coin_reference_id == coin_reference_id,
        CoinPriceGuide.grade_code == grade_code,
    ).order_by(CoinPriceGuide.price_date.desc()).first()
    
    guide_price = price_guide.pcgs_price if price_guide else None
    
    if grading_service in ('PCGS', 'NGC'):
        # Graded coin: prefer recent sales
        if len(sale_prices) >= 3:
            return Decimal(str(median(sale_prices))), 'high'
        elif len(sale_prices) >= 1:
            return Decimal(str(median(sale_prices))), 'medium'
        elif guide_price:
            # Guide typically runs 10% high
            return guide_price * Decimal('0.90'), 'medium'
        else:
            return Decimal('0'), 'low'
    
    else:
        # RAW coin: apply raw discount
        if is_grade_estimate:
            # Grade uncertainty: calculate range from adjacent grades
            value_range = await _calculate_grade_range(db, coin_reference_id, grade_code)
            return value_range * RAW_DISCOUNT, 'low'
        else:
            # User confident in grade
            if len(sale_prices) >= 1:
                base = Decimal(str(median(sale_prices)))
            elif guide_price:
                base = guide_price * Decimal('0.90')
            else:
                return Decimal('0'), 'low'
            
            return base * RAW_DISCOUNT, 'medium'

async def _calculate_grade_range(
    db: Session,
    coin_reference_id: int,
    grade_code: str,
) -> Decimal:
    """Calculate average value across adjacent grades for uncertainty"""
    
    # Get numeric value of current grade
    current_grade = db.query(ValidGrade).filter(
        ValidGrade.grade_code == grade_code
    ).first()
    
    if not current_grade:
        return Decimal('0')
    
    # Get adjacent grades (±2 display order)
    adjacent_grades = db.query(ValidGrade).filter(
        ValidGrade.display_order.between(
            current_grade.display_order - 2,
            current_grade.display_order + 1
        )
    ).all()
    
    values = []
    for grade in adjacent_grades:
        # Get price for this grade
        price = db.query(CoinPriceGuide).filter(
            CoinPriceGuide.coin_reference_id == coin_reference_id,
            CoinPriceGuide.grade_code == grade.grade_code,
        ).first()
        
        if price and price.pcgs_price:
            values.append(price.pcgs_price)
    
    if values:
        return Decimal(str(sum(values) / len(values)))
    return Decimal('0')

async def get_valuation_data(
    db: Session,
    coin_reference_id: int,
    grade_code: str,
) -> dict:
    """Get full valuation data for display in UI"""
    
    # Recent sales
    recent_sales = db.query(CoinSale).filter(
        CoinSale.coin_reference_id == coin_reference_id,
        CoinSale.grade_code == grade_code,
        CoinSale.sale_date >= date.today() - timedelta(days=90),
        CoinSale.is_problem_coin == False,
    ).order_by(CoinSale.sale_date.desc()).limit(5).all()
    
    # Price guide
    price_guide = db.query(CoinPriceGuide).filter(
        CoinPriceGuide.coin_reference_id == coin_reference_id,
        CoinPriceGuide.grade_code == grade_code,
    ).order_by(CoinPriceGuide.price_date.desc()).first()
    
    sale_prices = [float(s.sale_price) for s in recent_sales]
    suggested = median(sale_prices) if sale_prices else (float(price_guide.pcgs_price) * 0.9 if price_guide else 0)
    
    return {
        'priceGuide': float(price_guide.pcgs_price) if price_guide else None,
        'recentSales': sale_prices,
        'suggestedValue': suggested,
        'confidence': 'high' if len(sale_prices) >= 3 else 'medium' if sale_prices or price_guide else 'low',
    }
```

### Phase 5: Frontend Components

See the attached `coin_tracker_mockup_v3.jsx` file for the complete React implementation. Key components to extract:

1. **Main Dashboard Page** (`app/page.tsx` or `app/dashboard/page.tsx`)
   - Integrates with existing hooks
   - Adds Category Breakdown with drill-down
   - Adds Collection Items preview
   - Keeps Value Over Time chart

2. **AddItemModal Component** (`components/collection/AddItemModal.tsx`)
   - Step 1: Bullion vs Numismatic selection
   - Step 2a: Bullion form (metal, weight, quantity, description)
   - Step 2b: Grading service selection (PCGS/NGC/RAW)
   - Step 3a: Cert lookup for graded coins
   - Step 3b: Coin search + grade selector for raw coins
   - Problem coin toggle and type selector
   - Valuation display with suggested vs custom value

3. **Collection Tab Content** (`components/collection/CollectionGrid.tsx`)
   - Add Bullion/Numismatic/All toggle filter
   - Update item display to show category badges
   - Add confidence indicators
   - Add problem coin badges

4. **New Hooks**
   - `useCollectionSummary()` - fetches category breakdown data
   - `useCoinSearch(query)` - searches coin references
   - `useCertLookup(certNumber, service)` - looks up graded coin
   - `useGrades()` - fetches valid grades grouped by category
   - `useCoinValuation(pcgsNumber, grade)` - gets valuation data

5. **Shared Components**
   - `ConfidenceIndicator` - 4-dot indicator with label
   - `CategoryBadge` - BULLION (gold) or NUMISMATIC (blue) tag
   - `ProblemBadge` - Red badge for cleaned/damaged coins
   - `GradeSelector` - Dropdown with grades grouped by category

### Phase 6: API Integration

Update existing hooks and create new ones:

```typescript
// hooks/useCollectionSummary.ts
export function useCollectionSummary() {
  return useQuery({
    queryKey: ['collection-summary'],
    queryFn: async () => {
      const res = await fetch('/api/collection/summary');
      return res.json();
    },
  });
}

// hooks/useCoinSearch.ts
export function useCoinSearch(query: string) {
  return useQuery({
    queryKey: ['coin-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await fetch(`/api/coins/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.length >= 2,
  });
}

// hooks/useCertLookup.ts
export function useCertLookup(certNumber: string, service: string) {
  return useQuery({
    queryKey: ['cert-lookup', certNumber, service],
    queryFn: async () => {
      const res = await fetch(`/api/coins/cert/${certNumber}?service=${service}`);
      return res.json();
    },
    enabled: !!certNumber && certNumber.length >= 6,
  });
}

// hooks/useGrades.ts
export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const res = await fetch('/api/grades');
      return res.json();
    },
  });
}

// hooks/useCoinValuation.ts
export function useCoinValuation(pcgsNumber: number, gradeCode: string) {
  return useQuery({
    queryKey: ['coin-valuation', pcgsNumber, gradeCode],
    queryFn: async () => {
      const res = await fetch(`/api/coins/${pcgsNumber}/prices`);
      const data = await res.json();
      
      // Also get recent sales
      const salesRes = await fetch(`/api/coins/${pcgsNumber}/sales?grade=${gradeCode}`);
      const sales = await salesRes.json();
      
      return {
        priceGuide: data.prices.find(p => p.grade_code === gradeCode)?.pcgs_price,
        recentSales: sales.map(s => s.sale_price),
        suggestedValue: calculateSuggested(data, sales, gradeCode),
      };
    },
    enabled: !!pcgsNumber && !!gradeCode,
  });
}
```

## File Structure

```
backend/
  app/
    models/
      __init__.py
      coin_reference.py
      valid_grade.py
      coin_price_guide.py
      coin_sale.py
      collection_item.py
    schemas/
      coin.py
      collection.py
    services/
      valuation.py
      spot_prices.py (existing)
    routers/
      coins.py
      collection.py
      portfolio.py (existing)
    main.py

frontend/
  src/
    app/
      page.tsx (dashboard)
      collection/
        page.tsx
      collage/
        page.tsx
    components/
      collection/
        AddItemModal.tsx
        CollectionGrid.tsx
        CategoryBreakdown.tsx
      shared/
        ConfidenceIndicator.tsx
        CategoryBadge.tsx
        ProblemBadge.tsx
        GradeSelector.tsx
        CoinSearchInput.tsx
    hooks/
      useSpotPrices.ts (existing)
      usePortfolioSummary.ts (existing)
      useCollection.ts (existing)
      useCollectionSummary.ts
      useCoinSearch.ts
      useCertLookup.ts
      useGrades.ts
      useCoinValuation.ts
    types/
      index.ts
```

## Implementation Order

1. **Database**: Create tables, run migrations, seed valid_grades
2. **Backend Models**: Create SQLAlchemy models
3. **Backend Endpoints**: Implement all API routes
4. **Valuation Engine**: Implement calculation logic
5. **Frontend Hooks**: Create new data fetching hooks
6. **Frontend Components**: Build UI components from mockup
7. **Integration**: Connect everything together
8. **Testing**: Test all flows end-to-end

## Notes

- The PCGS scraper (separate prompt) should be run first to populate `coin_references` and `coin_price_guide` tables
- For cert lookup, you'll need to scrape PCGS/NGC verification pages or use their APIs if available
- The weekly refresh job (in scraper prompt) handles updating price guide and sales data
- Existing Plaid/Monarch integration should continue to work since we're using `calculated_value` field

Please start with the database schema and backend models, then work through each phase. Let me know after each phase so we can test before moving forward.
