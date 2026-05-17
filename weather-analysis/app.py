import asyncio
import json
import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from routers.llm import router as llm_router
from routers.climatology import router as climatology_router
from openai import OpenAI
from pydantic import BaseModel

import tools
from tools import call_tool


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llm_router)
app.include_router(climatology_router)