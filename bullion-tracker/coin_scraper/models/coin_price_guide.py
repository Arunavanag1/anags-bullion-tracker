from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, UniqueConstraint, func, Index
from sqlalchemy.orm import relationship
import sys
sys.path.append('..')
from database import Base

class CoinPriceGuide(Base):
    __tablename__ = 'CoinPriceGuide'

    id = Column(String, primary_key=True)
    coinReferenceId = Column('coinReferenceId', String, ForeignKey('CoinReference.id', ondelete='CASCADE'), nullable=False)
    gradeCode = Column('gradeCode', String(10), ForeignKey('ValidGrade.gradeCode'), nullable=False)
    pcgsPrice = Column('pcgsPrice', Numeric(12, 2))
    priceDate = Column('priceDate', Date, nullable=False)
    createdAt = Column('createdAt', DateTime, server_default=func.now())

    coinReference = relationship("CoinReference", back_populates="priceGuides")
    grade = relationship("ValidGrade", back_populates="priceGuides")

    __table_args__ = (
        UniqueConstraint('coinReferenceId', 'gradeCode', 'priceDate', name='CoinPriceGuide_coinReferenceId_gradeCode_priceDate_key'),
        Index('CoinPriceGuide_coinReferenceId_gradeCode_idx', 'coinReferenceId', 'gradeCode'),
    )

    def __repr__(self):
        return f"<CoinPriceGuide {self.coinReferenceId} {self.gradeCode}: ${self.pcgsPrice}>"
