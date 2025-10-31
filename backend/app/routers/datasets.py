from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal
from .. import models
from ..schemas import DatasetCreate, DatasetOut

router = APIRouter(prefix="/datasets", tags=["datasets"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=DatasetOut)
def create_dataset(payload: DatasetCreate, db: Session = Depends(get_db)):
    exists = db.query(models.Dataset).filter(models.Dataset.name == payload.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Dataset name already exists")
    ds = models.Dataset(
        name=payload.name,
        source_type=payload.source_type,
        source_config_json=payload.source_config_json,
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds

@router.get("", response_model=list[DatasetOut])
def list_datasets(db: Session = Depends(get_db)):
    return db.query(models.Dataset).order_by(models.Dataset.id.desc()).all()
