#!/bin/bash

# Stop Exam Portal Backend

PID_FILE="backend.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "Backend is not running (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" > /dev/null 2>&1; then
    echo "Stopping backend (PID: $PID)..."
    kill "$PID"
    
    # Wait for graceful shutdown
    for i in {1..30}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            echo "✓ Backend stopped successfully"
            rm "$PID_FILE"
            exit 0
        fi
        sleep 1
    done
    
    # Force kill if still running
    echo "Force killing backend..."
    kill -9 "$PID" 2>/dev/null || true
    rm "$PID_FILE"
    echo "✓ Backend stopped"
else
    echo "Process $PID is not running"
    rm "$PID_FILE"
fi
