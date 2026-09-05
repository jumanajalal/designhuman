from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Design//Human API",
    version="0.1.0",
    description="Human-variability stress-testing engine",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

from fastapi import FastAPI

from app.api.routes import router as coverage_router

app = FastAPI(
    title="Design//Human API",
    version="0.1.0",
    description="Human-variability stress-testing engine",
)

app.include_router(coverage_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}