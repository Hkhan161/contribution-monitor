# backend/utils/load_fec.py
import pandas as pd
from backend.constants import FEC_COLUMNS

def load_fec_file(file_path: str) -> pd.DataFrame:
    df = pd.read_csv(file_path, sep="|", header=None, names=FEC_COLUMNS, dtype=str)

    # Convert date + amount columns safely
    df["TRANSACTION_DT"] = pd.to_datetime(df["TRANSACTION_DT"], format="%m%d%Y", errors="coerce")
    df["TRANSACTION_AMT"] = pd.to_numeric(df["TRANSACTION_AMT"], errors="coerce")

    # Remove orgs (keep only individual donations)
    df = df[df["ENTITY_TP"] == "IND"]
    df = df[df["OTHER_ID"].isna() | (df["OTHER_ID"] == "")]

    # Normalize name (uppercase, strip whitespace)
    df["NAME"] = df["NAME"].fillna("").str.upper().str.strip()
    df["CITY"] = df["CITY"].fillna("").str.upper().str.strip()

    return df
