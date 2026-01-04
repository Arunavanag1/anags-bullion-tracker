#!/usr/bin/env python3
"""Seed the valid_grades table with all PCGS grades"""

import sys
import os
import uuid

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, init_db
from models.valid_grade import ValidGrade

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

def seed_grades():
    # Initialize database
    init_db()

    db = SessionLocal()

    try:
        # Clear existing grades
        db.query(ValidGrade).delete()

        # Insert grades
        for grade_code, numeric_value, category, display_order in VALID_GRADES:
            grade = ValidGrade(
                id=str(uuid.uuid4()),
                gradeCode=grade_code,
                numericValue=numeric_value,
                gradeCategory=category,
                displayOrder=display_order,
            )
            db.add(grade)

        db.commit()
        print(f"✅ Seeded {len(VALID_GRADES)} grades")

    finally:
        db.close()

if __name__ == '__main__':
    seed_grades()
