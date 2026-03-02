#!/usr/bin/env python3
import os
import sys

# Set API key directly
os.environ["FIERCRAWL_API_KEY"] = "fc-167f5c252b2b47c3aff6bf08f882555d"
os.environ["FIRECRAWL_API_KEY"] = "fc-167f5c252b2b47c3aff6bf08f882555d"

# Run the actual search script
import subprocess

script_path = "/root/.openclaw/workspace/skills/firecrawl-search/scripts/search.py"

query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "test"
limit = "--limit 5"

result = subprocess.run(
    ["python3", script_path, query, limit],
    capture_output=True,
    text=True,
    env={**os.environ, "FIRECRAWL_API_KEY": "fc-167f5c252b2b47c3aff6bf08f882555d"}
)

print(result.stdout)
if result.stderr:
    print(result.stderr, file=sys.stderr)
