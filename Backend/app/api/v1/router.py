"""Single authenticated versioned router; authentication also precedes parsing."""

from fastapi import APIRouter, Depends

from app.api.v1.profile import router as profile_router
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/v1", dependencies=[Depends(get_current_user)])
router.include_router(profile_router)
