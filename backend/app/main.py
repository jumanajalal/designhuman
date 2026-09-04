from fastapi import FastAPI

app = FastAPI(
    title="Design//Human API",
    version="0.1.0",
    description="Human-variability stress-testing engine",
)


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