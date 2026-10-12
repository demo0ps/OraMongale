#!/usr/bin/env bash
set -e
cd /home/user
# Bind Next to localhost so its self-referential URLs use localhost (not 0.0.0.0).
# Expose externally via socat on 0.0.0.0:3000 which preserves Host/X-Forwarded-*
# from the preview proxy and keeps Next's redirects sane.
npx next dev -p 3001 -H 127.0.0.1 &
NEXT_PID=$!
trap "kill $NEXT_PID; kill 0" EXIT
socat TCP-LISTEN:3000,bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:3001 &
wait $NEXT_PID
