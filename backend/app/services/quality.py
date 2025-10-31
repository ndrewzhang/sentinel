import pandas as pd
from sqlalchemy import text
from ..db import engine

def null_percent_rule(table_name: str, column: str, max_null_ratio: float):
    with engine.connect() as conn:
        df = pd.read_sql(text(f'SELECT "{column}" FROM {table_name}'), conn)
    ratio = float(df[column].isna().mean())
    passed = ratio <= max_null_ratio
    details = {"column": column, "null_ratio": ratio, "threshold": max_null_ratio}
    return passed, details

def range_rule(table_name: str, column: str, min_value: float | None, max_value: float | None):
    q = []
    if min_value is not None:
        q.append(f'"{column}" >= {min_value}')
    if max_value is not None:
        q.append(f'"{column}" <= {max_value}')
    where = " AND ".join(q) if q else "TRUE"

    with engine.connect() as conn:
        total = conn.execute(text(f'SELECT COUNT(*) FROM {table_name}')).scalar()
        bad = conn.execute(text(f'SELECT COUNT(*) FROM {table_name} WHERE NOT ({where})')).scalar()
    ratio = (bad / total) if total else 0.0
    passed = bad == 0
    details = {"column": column, "violations": int(bad), "total": int(total),
               "min": min_value, "max": max_value, "violation_ratio": ratio}
    return passed, details

def unique_rule(table_name: str, column: str):
    with engine.connect() as conn:
        total = conn.execute(text(f'SELECT COUNT(*) FROM {table_name}')).scalar()
        distinct = conn.execute(text(f'SELECT COUNT(DISTINCT "{column}") FROM {table_name}')).scalar()
        duplicates = total - distinct
    passed = duplicates == 0
    details = {"column": column, "duplicates": int(duplicates), "total": int(total)}
    return passed, details
