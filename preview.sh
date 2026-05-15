#!/bin/bash
# Convenience: rebuild and serve locally.
# Usage: ./preview.sh [port]

cd "$(dirname "$0")"
PORT="${1:-8000}"

echo ">>> Building..."
python3 build/build.py
echo ""
echo ">>> Serving site/ on http://localhost:$PORT"
echo ">>> Press Ctrl+C to stop"
echo ""
cd site && python3 -m http.server "$PORT"
