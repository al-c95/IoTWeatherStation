from fastapi import APIRouter
from tools import call_tool


router = APIRouter(prefix="/climatology", tags=["climatology"])


@router.get("/full-monthly")
async def calculate_climatology():

    return call_tool("calculate_climatology", {})