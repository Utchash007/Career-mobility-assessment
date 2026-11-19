"""Single authenticated versioned router; authentication also precedes parsing."""

from fastapi import APIRouter, Depends

from app.api.v1.profile import router as profile_router
from app.api.v1.opportunity import router as opportunity_router
from app.api.v1.match import router as match_router
from app.api.v1.shortlist import router as shortlist_router
from app.api.v1.me import router as me_router
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/v1", dependencies=[Depends(get_current_user)])
router.include_router(profile_router)
router.include_router(opportunity_router)
router.include_router(match_router)
router.include_router(shortlist_router)
router.include_router(me_router)
