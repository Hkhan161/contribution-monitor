# backend/engine/compliance_engine.py

import pandas as pd
from typing import List, Dict, Any


def evaluate_rules(row: pd.Series, rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Evaluates a list of compliance rules against a single row of FEC data.

    Parameters:
        row (pd.Series): A row from the FEC dataframe.
        rules (List[Dict]): A list of rules loaded from YAML.

    Returns:
        List[Dict]: A list of violations triggered by the row.
    """
    context = row.to_dict()
    violations = []

    # Convert numeric and date fields if not already
    if isinstance(context.get("TRANSACTION_AMT"), str):
        try:
            context["TRANSACTION_AMT"] = float(context["TRANSACTION_AMT"])
        except:
            context["TRANSACTION_AMT"] = 0

    # Add uppercase versions for robust rule matching
    context["STATE"] = context.get("STATE", "").upper()
    context["OCCUPATION"] = context.get("OCCUPATION", "").upper()
    context["EMPLOYER"] = context.get("EMPLOYER", "").upper()

    for rule in rules:
        try:
            condition = rule.get("condition", "")
            if condition and eval(condition, {}, context):
                violations.append({
                    "rule_id": rule.get("id", "unknown_rule"),
                    "message": rule.get("message", "Rule violated."),
                    "donation": {
                        "name": context.get("NAME"),
                        "amount": context.get("TRANSACTION_AMT"),
                        "state": context.get("STATE"),
                        "occupation": context.get("OCCUPATION"),
                        "employer": context.get("EMPLOYER"),
                        "date": context.get("TRANSACTION_DT"),
                        "committee_id": context.get("CMTE_ID"),
                    }
                })
        except Exception as e:
            # Optionally log or collect failed rule evaluations
            continue

    return violations
