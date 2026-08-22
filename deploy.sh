#!/bin/bash

set -e

APP_DIR="/home/ubuntu/cap-conn-backend"
APP_NAME="capacity-connect-backend"

echo "========================================"
echo " Capacity Connect Backend Deployment"
echo "========================================"

cd "$APP_DIR"

echo ""
echo "[1/6] Pulling latest code..."
git pull origin master

echo ""
echo "[2/6] Installing dependencies..."
npm install --omit=dev

echo ""
echo "[3/6] Applying Prisma migrations..."
npx prisma migrate deploy

echo ""
echo "[4/6] Generating Prisma Client..."
npx prisma generate

echo ""
echo "[5/6] Restarting application..."

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
else
    pm2 start ecosystem.config.js
fi

echo ""
echo "[6/6] Saving PM2 process list..."
pm2 save

echo ""
echo "========================================"
echo " Deployment completed successfully"
echo "========================================"

pm2 status