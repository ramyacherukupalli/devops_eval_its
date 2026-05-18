from flask import Blueprint, jsonify, request

from .services.graph_service import GraphStore

api_bp = Blueprint("api", __name__)
store = GraphStore()


@api_bp.get("/graph")
def get_graph():
    return jsonify(store.get_graph())


@api_bp.get("/route")
def get_route():
    source = request.args.get("source")
    destination = request.args.get("destination")

    if not source or not destination:
        return jsonify({"error": "source and destination are required"}), 400

    result = store.shortest_path(source, destination)
    if result is None:
        return jsonify({"error": "no route found"}), 404

    return jsonify(result)


@api_bp.post("/report")
def report_congestion():
    payload = request.get_json(silent=True) or {}
    from_node = payload.get("from")
    to_node = payload.get("to")
    severity = payload.get("severity", 1)

    if not from_node or not to_node:
        return jsonify({"error": "from and to are required"}), 400

    try:
        severity = int(severity)
    except (TypeError, ValueError):
        return jsonify({"error": "severity must be an integer"}), 400

    if severity < 0 or severity > 20:
        return jsonify({"error": "severity must be between 0 and 20"}), 400

    updated = store.report_congestion(from_node, to_node, severity)
    if updated is None:
        return jsonify({"error": "edge not found"}), 404

    return jsonify(updated)
