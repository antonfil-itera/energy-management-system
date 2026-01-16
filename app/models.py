from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, time
from decimal import Decimal

class FacilityBase(BaseModel):
    name: str
    type: str = Field(..., pattern="^(producer|consumer|accumulator)$")
    max_power: Decimal
    active_start_time: Optional[time] = None
    active_end_time: Optional[time] = None
    metadata: dict = Field(default_factory=dict)
    current_charge_kwh: Optional[Decimal] = Field(default=Decimal("0"))

class FacilityCreate(FacilityBase):
    pass

class Facility(FacilityBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TimeseriesEntry(BaseModel):
    facility_id: int
    power_value: Decimal

class TimeseriesBulkCreate(BaseModel):
    timestamp: datetime
    entries: List[TimeseriesEntry]

class Timeseries(BaseModel):
    id: int
    facility_id: int
    timestamp: datetime
    power_value: Decimal
    stored_energy_kwh: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TimeseriesQuery(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    facility_ids: Optional[List[int]] = None
