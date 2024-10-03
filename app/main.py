from fastapi import Body, FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles

from app.engine import apply_method, calculate_natal_chart

app = FastAPI()

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/calculate", response_class=JSONResponse)
async def calculate(data: dict = Body(...)):

    name = data.get('name')
    year = data.get('year')
    month = data.get('month')
    day = data.get('day')
    hour = data.get('hour')
    minute = data.get('minute')
    city = data.get('city')
    timezone = data.get('timezone')
    nation = data.get('nation')
    method = data.get('method')
    
    raw_data = calculate_natal_chart(name, year, month, day, hour, minute, city, timezone, nation)

    result = apply_method(raw_data, method)

    return JSONResponse(content=result)


