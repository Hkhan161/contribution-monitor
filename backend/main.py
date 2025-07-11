from fastapi import FastAPI, Query, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import math
import io
import csv

from backend.utils.load_fec import load_fec_file
from backend.utils.search import search_contributions

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEC_DATA = load_fec_file("backend/data/fec_2018_part1.txt")

def sanitize_for_json(obj):
    if isinstance(obj, float):
        if math.isinf(obj) or math.isnan(obj):
            return None
    return obj

def run_bulk_search(names: List[str], city: str = ""):
    all_results = []

    for name in names:
        matches = search_contributions(FEC_DATA, name, city)
        all_results.extend(matches)

    # Deduplicate based on SUB_ID or fallback
    seen = set()
    deduped = []
    for row in all_results:
        key = row.get("SUB_ID") or f"{row.get('NAME')}_{row.get('TRANSACTION_DT')}"
        if key not in seen:
            seen.add(key)
            deduped.append({k: sanitize_for_json(v) for k, v in row.items()})

    return deduped

@app.get("/search")
def search(names: List[str] = Query(...), city: str = Query(default="")):
    results = run_bulk_search(names, city)
    return JSONResponse(content={"results": results, "count": len(results)})

@app.post("/upload")
async def upload_names(file: UploadFile = File(...), city: str = Query(default="")):
    contents = await file.read()

    try:
        decoded = contents.decode('utf-8')
    except UnicodeDecodeError:
        return JSONResponse(status_code=400, content={"error": "Unable to decode file. Please upload UTF-8 text."})

    # Handle CSV and plain text
    if file.filename.endswith(".csv"):
        reader = csv.reader(io.StringIO(decoded))
        names = [row[0].strip() for row in reader if row]
    else:
        names = [line.strip() for line in decoded.splitlines() if line.strip()]

    if not names:
        return JSONResponse(status_code=400, content={"error": "No names found in uploaded file."})

    results = run_bulk_search(names, city)
    return JSONResponse(content={"results": results, "count": len(results)})

@app.post("/export")
async def export(file: UploadFile = File(...), city: str = Form("")):
    content = await file.read()
    names = content.decode("utf-8").splitlines()

    all_results = []
    for name in names:
        name = name.strip()
        if name:
            matches = search_contributions(FEC_DATA, name, city)
            all_results.extend(matches)

    seen = set()
    deduped = []
    for row in all_results:
        key = row.get("SUB_ID") or f"{row.get('NAME')}_{row.get('TRANSACTION_DT')}"
        if key not in seen:
            seen.add(key)
            deduped.append({k: sanitize_for_json(v) for k, v in row.items()})

    df = pd.DataFrame(deduped)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=contributions.csv"},
    )

@app.get("/ping")
def ping():
    return {"status": "ok"}
