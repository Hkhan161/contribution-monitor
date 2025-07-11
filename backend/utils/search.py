from rapidfuzz import fuzz
import pandas as pd

def search_contributions(df, name: str, city: str = None, min_score: int = 90):
    df = df[df["NAME"].notna()]
    df = df[df["NAME"].apply(lambda x: isinstance(x, str))]

    if city:
        df = df[df["CITY"].str.contains(city, case=False, na=False)]

    name_tokens = [t.strip().lower() for t in name.split() if t.strip()]

    def all_tokens_in_name(target_name):
        target = target_name.lower()
        return all(token in target for token in name_tokens)

    # Only keep rows where all tokens are present in the name
    df = df[df["NAME"].apply(all_tokens_in_name)]

    # Optionally, you can still score and sort by fuzzy score for display
    def score_name(target_name):
        return fuzz.token_set_ratio(name.lower(), target_name.lower())

    df["score"] = df["NAME"].apply(score_name)
    df_sorted = df.sort_values(by="score", ascending=False)

    if not df_sorted.empty:
        for col in df_sorted.columns:
            if df_sorted[col].dtype == "datetime64[ns]" or (
                len(df_sorted[col]) > 0 and isinstance(df_sorted[col].iloc[0], pd.Timestamp)
            ):
                df_sorted[col] = df_sorted[col].astype(str)

    return df_sorted.to_dict(orient="records")
