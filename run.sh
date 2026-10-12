#!/usr/bin/env bash
set -e
cd /home/user
./node_modules/.bin/next dev -p 3001 -H 127.0.0.1 &
NEXT_PID=$!
trap "kill $NEXT_PID" EXIT
socat TCP-LISTEN:3000,bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:3001
wait $NEXT_PID
