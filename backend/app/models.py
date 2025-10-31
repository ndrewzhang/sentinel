from sqlalchemy import Column, Integer, String, DateTime, JSON, func
from .db import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    source_type = Column(String, nullable=False, default="upload")  # "upload" | "api"
    source_config_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
