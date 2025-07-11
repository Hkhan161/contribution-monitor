# backend/rules/rule_loader.py
import yaml

def load_rules(file_path):
    with open(file_path, 'r') as f:
        return yaml.safe_load(f)
