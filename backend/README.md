# Smart Traffic Congestion Advisory System

This is a simple Flask backend that simulates a city graph and computes least-congested routes using Dijkstra.

## Endpoints

- `GET /graph`
  - Returns graph nodes and edges with current weights.

- `GET /route?source=A&destination=F`
  - Returns the shortest path, total cost, and edges on the route.

- `POST /report`
  - Updates congestion on a road.
  - JSON body: `{ "from": "A", "to": "B", "severity": 3 }`

## Setup

```bash
pip install -r requirements.txt
python run.py
```

## Notes

- Graph data is stored in `app/data/graph.json`.
- Congestion is applied as a multiplier on edge weights.
