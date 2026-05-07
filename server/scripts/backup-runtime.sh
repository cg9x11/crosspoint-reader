#!/bin/sh
set -eu

APP_DATA_DIR="${APP_DATA_DIR:-./runtime}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="${BACKUP_DIR%/}/crosspoint-reader-runtime-${STAMP}.tgz"

if [ ! -d "$APP_DATA_DIR" ]; then
  echo "APP_DATA_DIR not found: $APP_DATA_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
tar -C "$APP_DATA_DIR" -czf "$TARGET" .
echo "$TARGET"
