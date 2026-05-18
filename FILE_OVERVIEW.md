# File Overview

## Root
- README.md: Project overview, architecture, usage, and feature documentation.
- FILE_OVERVIEW.md: This file.

## backend/
- README.md: Backend-specific setup and usage notes.
- requirements.txt: Python dependencies for the Flask backend.
- run.py: Backend entry point that starts the Flask app.

## backend/app/
- __init__.py: App factory and Flask setup (blueprints, config, CORS).
- config.py: Backend configuration values.
- routes.py: API endpoints for graph, route, and congestion reporting.

## backend/app/data/
- graph.json: Graph data store (nodes, edges, base_weight, congestion_value).

## backend/app/services/
- graph_service.py: Graph loading, persistence, congestion updates, and Dijkstra routing logic.

## frontend/
- index.html: UI layout and page structure.
- styles.css: Styling for the UI and map.

## frontend/js/
- api.js: HTTP helpers for /graph, /route, and /report.
- constants.js: Node labels and map coordinates.
- main.js: UI behavior, form handling, and route summary logic.
- mapView.js: Leaflet map rendering and route highlighting.
