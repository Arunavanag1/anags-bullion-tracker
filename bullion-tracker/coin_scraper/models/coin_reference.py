from sqlalchemy import Column, String, Integer, Numeric, DateTime, func, Index
from sqlalchemy.orm import relationship
import sys
sys.path.append('..')
from database import Base

class CoinReference(Base):
    __tablename__ = 'CoinReference'

    id = Column(String, primary_key=True)
    pcgsNumber = Column('pcgsNumber', Integer, unique=True, nullable=False, index=True)
    ngcNumber = Column('ngcNumber', Integer)
    year = Column(Integer, nullable=False, index=True)
    mintMark = Column('mintMark', String(5))
    denomination = Column(String(50), nullable=False)
    series = Column(String(100), nullable=False, index=True)
    variety = Column(String(200))
    metal = Column(String(20))
    weightOz = Column('weightOz', Numeric(10, 4))
    fineness = Column(Numeric(5, 4))
    mintage = Column(Integer)
    fullName = Column('fullName', String(300), nullable=False)
    searchTokens = Column('searchTokens', String)
    createdAt = Column('createdAt', DateTime, server_default=func.now())
    updatedAt = Column('updatedAt', DateTime, server_default=func.now(), onupdate=func.now())

    priceGuides = relationship("CoinPriceGuide", back_populates="coinReference")

    def __repr__(self):
        return f"<CoinReference {self.pcgsNumber}: {self.fullName}>"

    @staticmethod
    def generate_search_tokens(year, mint_mark, denomination, series, variety, full_name):
        """Generate text for tsvector search"""
        parts = [
            str(year) if year else '',
            mint_mark or '',
            denomination or '',
            series or '',
            variety or '',
            full_name or '',
        ]
        return ' '.join(filter(None, parts))
