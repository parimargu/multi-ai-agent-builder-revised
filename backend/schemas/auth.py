"""
Pydantic schemas for authentication endpoints.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    organization_name: str = Field(..., min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    tenant_id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


TokenResponse.model_rebuild()
