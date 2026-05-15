#!/bin/bash
set -e

echo "🚀 AI Factory bootstrap iniciado"

cd /workspaces/synth-forge-grid

if [ -f package.json ]; then
  npm install || true
fi

mkdir -p /workspaces

if [ ! -d /workspaces/rh-prospera-hub ]; then
  echo "📦 Clonando projeto real TOPAC RH"
  git clone https://github.com/implantarhconsultoria-coder/rh-prospera-hub.git /workspaces/rh-prospera-hub || true
else
  echo "🔄 Atualizando projeto real TOPAC RH"
  cd /workspaces/rh-prospera-hub
  git pull || true
fi

cd /workspaces/synth-forge-grid

pkill -f "node.*factory-worker/index.mjs" || true

nohup node factory-worker/index.mjs > factory-worker.log 2>&1 &

echo "✅ AI Factory Worker iniciado automaticamente"
