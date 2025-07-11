# Political Contribution Monitor

A full-stack web app to search, analyze, and visualize political campaign contributions by name and city, using fuzzy matching and interactive dashboards.

---

## Features

### Backend — `FastAPI`, `Pandas`, `RapidFuzz`

- **Flexible Name Matching**:
  - Distinguishes between single-word and full-name queries
    - `"paul"` → Loose match on first/last/middle
    - `"carol blecker"` → Strict matching on both names (AND logic)
  - Handles formats like `LAST, FIRST` and `FIRST LAST`
  - Prioritizes exact matches but supports fuzziness for user error

- **Smart City Filtering**:
  - Optional `city` field filters by substring match

- **Result Grouping + Ranking**:
  - Groups all contributions by the same person
  - Sorts by fuzzy score, then by total contributions

- **Performance-First Logic**:
  - Efficient token matching
  - Handles datetime fields automatically for clean API responses

- **Returns JSON results with**:
  - Name, date, amount, city, fuzzy match score

---

### Frontend — `React`, `Tailwind`, `Vite`

- **User Inputs**:
  - Multi-name input (one per line)
  - Optional city input

- **Interactive Results**:
  - Expandable donor entries (grouped by name)
  - Each donor card shows:
    - Total donations
    - Number of donations
    - Highest match score

- **Analytics Section**:
  - Largest contributors
  - Top recipients
  - Timeline of contributions (Recharts)

- **Grouped by Name**:
  - All donations under one entry per name
  - Sorted by match score, then by total

---

## Project Structure

```
political-monitor/
├── backend/
│   ├── main.py                # FastAPI entrypoint
│   ├── utils/
│   │   └── search.py          # Fuzzy search logic
│   ├── ...                    # Other backend modules (engine, rules, etc.)
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main React app
│   │   └── ...                # Other frontend source files
│   ├── package.json           # Frontend dependencies
│   ├── tailwind.config.js     # TailwindCSS config
│   └── ...                    # Other config/build files
├── requirements.txt           # Backend dependencies
├── .gitignore                 # Ignore rules for Python, Node, data, etc.
├── README.md                  # Project overview & docs
└── ...                        # (Optional) Makefile, sample data, etc.
```

---

## Quickstart

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/political-monitor.git
cd political-monitor

# Backend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Run Locally

**Backend:**
```bash
uvicorn backend.main:app --reload --port 8001
```
**Frontend:**
```bash
cd frontend
npm run dev
```

- Backend → http://localhost:8001
- Frontend → http://localhost:5173

---

## Example API Request

```bash
curl "http://localhost:8001/search?names=carol%20blecker&city=new%20york"
```

Returns:
```json
[
  {
    "NAME": "BLECKER, CAROL",
    "AMOUNT": 500,
    "CITY": "NEW YORK",
    "DATE": "2023-06-15",
    "score": 97
  },
  ...
]
```

---

## Design Decisions & Trade-Offs

### What We Did

- **Fuzzy Logic Split:** One-token vs full-name paths for casual typo forgiveness and precise results when desired.
- **Token AND Matching:** All tokens in a multi-word query must be present in the candidate name.
- **Pre-Grouping Results:** Merges all donations under one contributor, helps rank based on both relevance and impact.

### What We Could Improve

- Normalize names better (e.g., handle initials, suffixes, nicknames)
- Add address-based deduplication (e.g., John P vs John Paul)
- Better encoding handling for weird characters or OCR artifacts
- Frontend autosuggest or live preview as user types

### Scaling for Production

- **Backend:** Use DuckDB/SQLite/Postgres for scalable querying, index names/cities for fast lookup
- **Frontend:** Add pagination/infinite scroll, state management for large results, CSV export
- **Infra:** Containerize with Docker, deploy via Fly.io/Railway/Vercel, use cloud-based data sources

---

## Built With

- FastAPI
- Pandas
- RapidFuzz
- React
- TailwindCSS
- Recharts

---
