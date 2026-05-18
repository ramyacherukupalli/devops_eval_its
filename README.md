# Smart Traffic Routing with Real-Time Congestion

## Problem Statement
Build a web-based Smart Traffic Congestion Advisory System where users report traffic congestion on roads and the system computes the least-congested route between a selected source and destination using a graph-based shortest path algorithm.

## Solution Overview
This project models a small Bengaluru road network as an undirected, weighted graph. Each road has a base travel cost and a congestion value that increases when users report traffic. The backend recomputes the shortest path using Dijkstra on the updated weights, while the frontend visualizes roads and congestion in real time using Leaflet.

## Tech Stack
- Backend: Flask (Python)
- Frontend: HTML, CSS, JavaScript
- Map Visualization: Leaflet.js
- Data Format: JSON (graph representation)
- Algorithm: Dijkstra’s Shortest Path

## Core Logic
- Nodes represent locations.
- Edges represent roads.
- Base weight represents normal travel time.
- Congestion value dynamically increases based on user reports.
- Current weight used for routing:
  - `current_weight = base_weight + congestion_value`

### Congestion Ratio Logic
Traffic color is based on the ratio between current and base cost:
- `ratio = current_weight / base_weight`

Thresholds:
- `ratio <= 1.2` -> LOW (green)
- `ratio <= 2.0` -> MEDIUM (orange)
- `ratio > 2.0` -> HIGH (red)

This mimics how real navigation systems judge slowdowns (current time vs normal time).

## Features
- Interactive map visualization using Leaflet.js
- Graph-based routing using Dijkstra’s algorithm
- Dynamic congestion updates via user input
- Real-time route recalculation based on traffic conditions
- Color-coded traffic visualization using congestion ratio
- Highlighted optimal route with map zoom and focus
- Route summary including traffic status and estimated cost
- Reset functionality to restore default view

## Project Structure
```text
ITS Project/
├─ README.md
├─ backend/
│  ├─ README.md
│  ├─ requirements.txt
│  ├─ run.py
│  └─ app/
│     ├─ __init__.py
│     ├─ config.py
│     ├─ routes.py
│     ├─ data/
│     │  └─ graph.json
│     └─ services/
│        └─ graph_service.py
└─ frontend/
   ├─ index.html
   ├─ styles.css
   └─ js/
      ├─ api.js
      ├─ constants.js
      ├─ main.js
      └─ mapView.js
```

## Backend API
- `GET /graph`
  - Returns nodes and edges with `base_weight`, `congestion_value`, and `current_weight`.
  - The graph is undirected: congestion updates affect both directions of a road.

- `GET /route?source=<name>&destination=<name>`
  - Returns the shortest path, total cost, and edge list.

- `POST /report`
  - Body: `{ "from": "Koramangala", "to": "Indiranagar", "severity": 10 }`
  - Severity range: `0..20`
  - `congestion_value` is increased by the reported severity.
  - `0` resets congestion for that road to normal.

## How Routing Works
1. User selects source/destination.
2. Backend runs Dijkstra on `current_weight` (dynamic edge weights).
3. Shortest path is returned with total cost and edges.
4. Frontend highlights route in blue while showing congestion globally.

## How Congestion Updates Work
1. User reports congestion on a road.
2. Backend increases `congestion_value` for the road (undirected).
3. Edge `current_weight` changes immediately.
4. Frontend redraws roads and recomputes the last route.

## Persistence Note
- Congestion resets on reload (simulation mode).

## How to Run
### Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend
```bash
cd frontend
python -m http.server 5500
```
Open: `http://localhost:5500`

## UI Behavior
- Roads are color-coded based on traffic (green/orange/red).
- Selected route is a blue overlay, thicker and brighter.
- Congested roads remain visible even when a route is selected.
- Popups show details for roads and the best route.

## Example
If Koramangala -> Indiranagar has base 6 and congestion +10:
- `current_weight = 16`
- `ratio = 16 / 6 = 2.66` -> HIGH (red)
- The route will avoid this edge if a cheaper alternative exists.

## Algorithm Complexity
- Dijkstra Time Complexity: O((V + E) log V)
- Suitable for real-time updates on small to medium graphs

## Key Insight
Traffic is evaluated using a ratio of current travel cost to base cost, enabling realistic congestion modeling similar to real-world navigation systems.

## Future Improvements
- Integrate real-time traffic APIs (Google Maps, HERE Maps)
- Support larger city-scale graphs
- Add database persistence for congestion data
- Implement A* algorithm for faster routing

