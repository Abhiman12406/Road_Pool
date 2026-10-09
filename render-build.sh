#!/usr/bin/env bash
# ==============================================================================
# Unified Build Script for Single-Service Render Deployment
# Builds both Frontend (Vite) and Backend (FastAPI) into a single container/service
# ==============================================================================
set -o errexit

echo "===> 1. Building Frontend SPA (Vite + React)..."
cd frontend
npm ci || npm install
npm run build
cd ..

echo "===> 2. Installing Python Backend Dependencies..."
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "===> Build completed successfully! Ready to launch with uvicorn."
