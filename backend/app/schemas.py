from pydantic import BaseModel

class DatasetCreate(BaseModel):
    name: str
    source_type: str = "upload"
    source_config_json: dict | None = None

class DatasetOut(BaseModel):
    id: int
    name: str
    source_type: str
    class Config:
        from_attributes = True  # pydantic v2
