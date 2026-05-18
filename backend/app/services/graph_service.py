from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from heapq import heappop, heappush
from pathlib import Path
from typing import Dict, List, Optional, Tuple


@dataclass
class Edge:
    edge_id: str
    from_node: str
    to_node: str
    base_weight: float
    congestion_value: float

    @property
    def current_weight(self) -> float:
        return self.base_weight + self.congestion_value


class GraphStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._nodes: List[str] = []
        self._edges: Dict[str, Edge] = {}
        self._load_graph()

    def _data_path(self) -> Path:
        return Path(__file__).resolve().parent.parent / "data" / "graph.json"

    def _load_graph(self) -> None:
        data_path = self._data_path()
        with data_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)

        self._nodes = list(data.get("nodes", []))
        self._edges = {}

        for edge in data.get("edges", []):
            edge_id = edge["id"]
            self._edges[edge_id] = Edge(
                edge_id=edge_id,
                from_node=edge["from"],
                to_node=edge["to"],
                base_weight=float(edge["base_weight"]),
                congestion_value=float(edge.get("congestion_value", 0.0)),
            )

    def _save_graph(self) -> None:
        data = {
            "nodes": list(self._nodes),
            "edges": [
                {
                    "id": edge.edge_id,
                    "from": edge.from_node,
                    "to": edge.to_node,
                    "base_weight": edge.base_weight,
                    "congestion_value": edge.congestion_value,
                }
                for edge in self._edges.values()
            ],
        }
        data_path = self._data_path()
        with data_path.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2)

    def get_graph(self) -> Dict[str, object]:
        with self._lock:
            edges_payload = [
                {
                    "id": edge.edge_id,
                    "from": edge.from_node,
                    "to": edge.to_node,
                    "base_weight": edge.base_weight,
                    "congestion_value": edge.congestion_value,
                    "current_weight": edge.current_weight,
                }
                for edge in self._edges.values()
            ]

        return {"nodes": self._nodes, "edges": edges_payload}

    def report_congestion(self, from_node: str, to_node: str, severity: int) -> Optional[Dict[str, object]]:
        edge_id = self._find_edge_id(from_node, to_node)
        if edge_id is None:
            return None

        with self._lock:
            edge = self._edges[edge_id]
            edge.congestion_value = float(severity)

            self._save_graph()

            return {
                "id": edge.edge_id,
                "from": edge.from_node,
                "to": edge.to_node,
                "base_weight": edge.base_weight,
                "congestion_value": edge.congestion_value,
                "current_weight": edge.current_weight,
            }

    def shortest_path(self, source: str, destination: str) -> Optional[Dict[str, object]]:
        if source not in self._nodes or destination not in self._nodes:
            return None

        with self._lock:
            adjacency = self._build_adjacency()

        distances: Dict[str, float] = {node: float("inf") for node in self._nodes}
        previous: Dict[str, Optional[str]] = {node: None for node in self._nodes}
        visited = set()

        distances[source] = 0.0
        heap: List[Tuple[float, str]] = [(0.0, source)]

        while heap:
            current_distance, current_node = heappop(heap)
            if current_node in visited:
                continue
            visited.add(current_node)

            if current_node == destination:
                break

            for neighbor, weight, edge_id in adjacency.get(current_node, []):
                if neighbor in visited:
                    continue

                new_distance = current_distance + weight
                if new_distance < distances[neighbor]:
                    distances[neighbor] = new_distance
                    previous[neighbor] = current_node
                    heappush(heap, (new_distance, neighbor))

        if distances[destination] == float("inf"):
            return None

        path_nodes = self._reconstruct_path(previous, destination)
        path_edges = self._path_edges(path_nodes)

        return {
            "source": source,
            "destination": destination,
            "path": path_nodes,
            "edges": path_edges,
            "total_cost": round(distances[destination], 3),
        }

    def _build_adjacency(self) -> Dict[str, List[Tuple[str, float, str]]]:
        adjacency: Dict[str, List[Tuple[str, float, str]]] = {node: [] for node in self._nodes}
        for edge in self._edges.values():
            adjacency[edge.from_node].append((edge.to_node, edge.current_weight, edge.edge_id))
            adjacency[edge.to_node].append((edge.from_node, edge.current_weight, edge.edge_id))

        return adjacency

    def _reconstruct_path(self, previous: Dict[str, Optional[str]], destination: str) -> List[str]:
        path = []
        current = destination
        while current is not None:
            path.append(current)
            current = previous[current]

        path.reverse()
        return path

    def _path_edges(self, path_nodes: List[str]) -> List[Dict[str, object]]:
        edges = []
        for i in range(len(path_nodes) - 1):
            from_node = path_nodes[i]
            to_node = path_nodes[i + 1]
            edge_id = self._find_edge_id(from_node, to_node)
            if edge_id is None:
                continue

            edge = self._edges[edge_id]
            edges.append(
                {
                    "id": edge.edge_id,
                    "from": edge.from_node,
                    "to": edge.to_node,
                    "base_weight": edge.base_weight,
                    "current_weight": edge.current_weight,
                }
            )

        return edges

    def _find_edge_id(self, from_node: str, to_node: str) -> Optional[str]:
        for edge_id, edge in self._edges.items():
            if edge.from_node == from_node and edge.to_node == to_node:
                return edge_id
            if edge.from_node == to_node and edge.to_node == from_node:
                return edge_id
        return None
