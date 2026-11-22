#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
SCEN="${SR_SCENARIO:-recording.json}"
OUT="${SR_OUTPUT:-public/clips/walkthrough.mp4}"
screen-recorder build "$SCEN" -o "$OUT" --workers 1 --force record
