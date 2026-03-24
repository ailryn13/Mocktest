#!/bin/bash
cd "$(dirname "$0")"
for f in *; do
    clean=$(echo -n "$f" | tr -d '\r')
    if [ "$f" != "$clean" ]; then
        mv "$f" "$clean"
    fi
done
# Also fix backend and frontend subdirs
for d in backend frontend; do
    if [ -d "$d" ]; then
        cd "$d"
        for f in *; do
            clean=$(echo -n "$f" | tr -d '\r')
            if [ "$f" != "$clean" ]; then
                mv "$f" "$clean"
            fi
        done
        cd ..
    fi
done
