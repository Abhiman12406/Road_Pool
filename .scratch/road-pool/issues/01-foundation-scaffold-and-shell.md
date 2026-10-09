# 01: Foundation Scaffold & End-to-End Shell Tracer Bullet

**What to build:** Scaffold the RidePool AI monorepo with a FastAPI Python 3.12 backend and a React 18 + Vite + TypeScript frontend styled using the Kinetic Glow design tokens. From the user's perspective, the web app loads with a persistent Application Shell featuring the global portal switch (Operations Console vs. Passenger App), live simulation control bar (Play, Pause, Step, Reset, Speed), and an interactive Leaflet map of Pune showing real-time ping updates streamed over WebSockets.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Backend runs on Python 3.12 with FastAPI, CORS, and WebSocket endpoint `/ws/live` streaming tick events.
- [x] Frontend runs on React + Vite + TypeScript with Tailwind CSS configured using Stitch Kinetic Glow design tokens and Plus Jakarta Sans.
- [x] Global header allows switching between Operations view and Passenger view without resetting state.
- [x] Simulation control bar allows toggling between Running, Paused, Stepping, and Reset states.
- [x] Leaflet map renders centered on Pune, India (18.5204, 73.8567) and displays live simulated vehicle positions.
- [x] End-to-end health check and WebSocket ping succeed cleanly.
