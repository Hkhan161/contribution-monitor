# backend/dev_test_load.py
from backend.utils.load_fec import load_fec_file

df = load_fec_file("backend/data/fec_2018_part1.txt")

print(df.head(5))
print("Rows loaded:", len(df))
print("Columns:", df.columns.tolist())
