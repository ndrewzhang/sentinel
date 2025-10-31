from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from .db import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    source_type = Column(String, nullable=False, default="upload")  # "upload" | "api"
    source_config_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Metric(Base):
    __tablename__ = "metrics"
    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    name = Column(String, nullable=False)
    ts_column = Column(String, nullable=False)
    value_column = Column(String, nullable=False)

class MetricPoint(Base):
    __tablename__ = "metric_points"
    id = Column(Integer, primary_key=True)
    metric_id = Column(Integer, ForeignKey("metrics.id"), nullable=False)
    ts = Column(DateTime, nullable=False)
    value = Column(Float, nullable=False)