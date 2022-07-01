#!/usr/bin/env bash

# Preload base bash configuration and functions
source bgord-scripts/base.sh

info "Environment: local"
info "Starting project..."

# ==========================================================

cp node_modules/@bgord/design/dist/main.min.css static/
cp node_modules/@bgord/design/dist/normalize.min.css static/
info "Copied CSS from @bgord/design"

# ==========================================================

export NODE_ENV="local"

npx esbuild \
  --bundle \
  --platform=node \
  --watch index.tsx \
  --external:'canvas' \
  --external:'jsdom' \
  --outdir="./" \
  --sourcemap \
  $@
