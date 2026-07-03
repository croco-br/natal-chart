from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles

from app.engine import calculate_chart
from app.models import ChartRequest

app = FastAPI()

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/calculate", response_class=JSONResponse)
async def calculate(req: ChartRequest):
    """Single entry point — dispatches on req.method."""
    try:
        result = calculate_chart(
            req.date, req.time, req.city,
            name=req.name, method=req.method,
        )
    except (ValueError, LookupError) as exc:
        return JSONResponse(status_code=422, content={"error": str(exc)})
    return JSONResponse(content=result)
