from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
import sys
sys.path.append('..')
from database import Base

class ValidGrade(Base):
    __tablename__ = 'ValidGrade'

    id = Column(String, primary_key=True)
    gradeCode = Column('gradeCode', String(10), unique=True, nullable=False, index=True)
    numericValue = Column('numericValue', Integer, nullable=False)
    gradeCategory = Column('gradeCategory', String(30), nullable=False)
    displayOrder = Column('displayOrder', Integer, nullable=False)

    priceGuides = relationship("CoinPriceGuide", back_populates="grade")

    def __repr__(self):
        return f"<ValidGrade {self.gradeCode}>"
