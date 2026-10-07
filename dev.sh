#!/bin/bash

# Ensure all background processes are killed when you press Ctrl+C
trap "kill 0" EXIT

echo "🚀 Starting FastAPI Backend (Port 8000)..."
python -m uvicorn src.api.main:app --reload --port 8000 &

echo "🚀 Starting React Frontend (Port 3000)..."
# Check if node_modules exists, if not, run npm install
if [ ! -d "web-react/node_modules" ]; then
  echo "📦 Installing React dependencies first..."
  (cd web-react && npm install)
fi

(cd web-react && npm run dev) &

echo ""
echo "✅ Both servers are starting!"
echo "👉 Frontend: http://localhost:3000"
echo "👉 Backend:  http://localhost:8000/docs"
echo "🛑 Press Ctrl+C to stop both servers."
echo ""

# Wait keeps the script running and listening for Ctrl+C
wait
