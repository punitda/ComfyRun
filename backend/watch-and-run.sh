#!/bin/sh

# Install watchfiles
pip install watchfiles

# Start the file watcher
watchfiles --filter python "fastapi run src/main.py --port 80" /app/src