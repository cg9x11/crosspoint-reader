#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/cg9x11/crosspoint-reader.git}"
BRANCH="${BRANCH:-master}"
CHECKOUT_DIR="${CHECKOUT_DIR:-/home/noe/crosspoint-reader-repo}"
DEPLOY_DIR="${DEPLOY_DIR:-/home/noe/crosspoint-reader-server}"
APP_DATA_DIR="${APP_DATA_DIR:-/srv/dev-disk-by-uuid-efa4bb57-8270-4740-be2c-01caa4be7407/docker-data/crosspoint-reader/runtime}"

if [[ -z "$DEPLOY_DIR" || "$DEPLOY_DIR" == "/" ]]; then
  echo "Refusing to deploy into an unsafe DEPLOY_DIR: '$DEPLOY_DIR'" >&2
  exit 1
fi

mkdir -p "$CHECKOUT_DIR" "$DEPLOY_DIR"

if [[ ! -d "$CHECKOUT_DIR/.git" ]]; then
  rm -rf "$CHECKOUT_DIR"
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$CHECKOUT_DIR"
else
  git -C "$CHECKOUT_DIR" fetch origin
  git -C "$CHECKOUT_DIR" checkout "$BRANCH"
  git -C "$CHECKOUT_DIR" reset --hard "origin/$BRANCH"
  git -C "$CHECKOUT_DIR" clean -fd
fi

sudo mkdir -p "$APP_DATA_DIR"

find "$DEPLOY_DIR" -mindepth 1 -maxdepth 1 \
  ! -name ".env" \
  ! -name "runtime" \
  -exec rm -rf {} +

tar -C "$CHECKOUT_DIR/server" \
  --exclude=".env" \
  --exclude="runtime" \
  --exclude="node_modules" \
  --exclude="dist" \
  --exclude=".tmp-*" \
  -cf - . | tar -C "$DEPLOY_DIR" -xf -

if [[ ! -f "$DEPLOY_DIR/.env" ]]; then
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
  echo "Created $DEPLOY_DIR/.env from template. Review secrets before exposing publicly." >&2
fi

cd "$DEPLOY_DIR"
APP_DATA_DIR="$APP_DATA_DIR" sudo -n docker compose up --build -d app worker
sudo -n docker compose exec -T app node scripts/backfill-cover-assets.mjs

echo "Redeployed crosspoint-reader server from $REPO_URL@$BRANCH"
