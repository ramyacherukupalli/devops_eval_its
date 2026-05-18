import { getNodeCoords, getNodeName } from "./constants.js";

let map;
let nodeMarkers = {};
let edgeLines = {};
let currentRouteEdges = [];
let routeLine = null;

export function initMap() {
  map = L.map("map", { zoomControl: false }).setView([12.9280, 77.6500], 12.1);
  L.control.zoom({ position: "bottomright" }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  setupFullscreenToggle();
}

export function renderGraph(data) {
  clearMap();

  data.nodes.forEach((node) => {
    const coords = getNodeCoords(node);
    if (!coords) return;
    const marker = L.marker(coords, {
      title: getNodeName(node)
    }).addTo(map);
    marker.bindTooltip(getNodeName(node), {
      permanent: true,
      direction: "top",
      offset: [0, -6]
    });
    nodeMarkers[node] = marker;
  });

  data.edges.forEach((edge) => {
    const fromCoords = getNodeCoords(edge.from);
    const toCoords = getNodeCoords(edge.to);
    if (!fromCoords || !toCoords) return;

    const congestionValueRaw = Number(edge.congestion_value || 0);
    const baseValueRaw = Number(edge.base_weight || 0);
    const finalValueRaw = Number(edge.current_weight || 0);
    const ratioValue = baseValueRaw > 0 ? finalValueRaw / baseValueRaw : 1;
    const trafficLevel = getTrafficLevel(ratioValue);
    const weightValue = finalValueRaw.toFixed(2);
    const baseValue = baseValueRaw.toFixed(2);
    const congestionValue = congestionValueRaw.toFixed(2);
    const line = L.polyline([fromCoords, toCoords], {
      color: getTrafficColor(ratioValue),
      weight: 5,
      opacity: 0.8,
      edgeWeight: edge.current_weight
    }).addTo(map);

    line.bindPopup(
      `${edge.from} \u2192 ${edge.to}<br/>Base: ${baseValue}<br/>Congestion: ${congestionValue}<br/>Total: ${weightValue}<br/>Traffic: ${trafficLevel}`,
      { className: "popup-road" }
    );

    edgeLines[edge.id] = {
      line,
      weight: finalValueRaw,
      baseWeight: baseValueRaw,
      ratio: ratioValue
    };
  });

  if (currentRouteEdges.length) {
    applyRouteStyles(currentRouteEdges);
  }
}

export function clearRouteSelection() {
  currentRouteEdges = [];
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
}

export function updateRouteLine(pathNodes, routeEdges = [], routeMeta = null) {
  if (routeLine) {
    map.removeLayer(routeLine);
  }

  currentRouteEdges = routeEdges;
  applyRouteStyles(routeEdges);

  const pathCoords = pathNodes.map((node) => getNodeCoords(node)).filter(Boolean);
  routeLine = L.polyline(pathCoords, {
    color: "#38bdf8",
    weight: 7,
    opacity: 0.75
  }).addTo(map);

  if (routeMeta) {
    const routeRatio = computeRouteRatio(routeEdges);
    const routeTraffic = getTrafficLevel(routeRatio ?? 1);
    const popupContent = `<b>Best Route</b><br/>${routeMeta.source} \u2192 ${routeMeta.destination}<br/>Time: ${Number(
      routeMeta.totalCost
    ).toFixed(2)}<br/>Traffic: ${routeTraffic}`;
    routeLine.bindPopup(popupContent, { className: "popup-route" }).openPopup();
  }

  routeLine.bringToFront();

  map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
}

function applyRouteStyles(routeEdges) {
  const routeEdgeIds = new Set(routeEdges.map((edge) => edge.id));

  Object.entries(edgeLines).forEach(([edgeId, edgeData]) => {
    const line = edgeData.line;
    const ratioValue = edgeData.ratio ?? 1;
    const trafficLevel = getTrafficLevel(ratioValue);
    if (routeEdgeIds.has(edgeId)) {
      line.setStyle({
        color: getTrafficColor(ratioValue),
        weight: 4,
        opacity: 0.85
      });
      line.bringToFront();
      return;
    }
    if (trafficLevel === "HIGH" || trafficLevel === "MEDIUM") {
      line.setStyle({
        color: getTrafficColor(ratioValue),
        weight: 4,
        opacity: 0.8
      });
    } else {
      line.setStyle({ color: "#94a3b8", weight: 2, opacity: 0.2 });
    }
  });
}

function clearMap() {
  Object.values(nodeMarkers).forEach((marker) => map.removeLayer(marker));
  Object.values(edgeLines).forEach((edgeData) => map.removeLayer(edgeData.line));
  nodeMarkers = {};
  edgeLines = {};
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
}

function getTrafficLevel(ratio) {
  if (ratio <= 1.2) return "LOW";
  if (ratio <= 2) return "MEDIUM";
  return "HIGH";
}

function computeRouteRatio(routeEdges) {
  if (!routeEdges || !routeEdges.length) return null;
  let baseTotal = 0;
  let currentTotal = 0;
  routeEdges.forEach((edge) => {
    const baseValue = Number(edge.base_weight ?? 0);
    const currentValue = Number(edge.current_weight ?? 0);
    baseTotal += baseValue;
    currentTotal += currentValue;
  });
  if (baseTotal <= 0) return null;
  return currentTotal / baseTotal;
}

function getTrafficColor(ratio) {
  if (ratio <= 1.2) return getCssColor("--low");
  if (ratio <= 2) return getCssColor("--medium");
  return getCssColor("--high");
}

function getCssColor(variableName) {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

function setupFullscreenToggle() {
  const button = document.getElementById("fullscreen-toggle");
  const mapElement = document.getElementById("map");

  if (!button || !mapElement) return;

  button.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      mapElement.requestFullscreen().catch(() => {});
      return;
    }

    document.exitFullscreen().catch(() => {});
  });

  document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement === mapElement;
    const label = isFullscreen ? "Exit full screen" : "Enter full screen";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    const srText = button.querySelector(".sr-only");
    if (srText) {
      srText.textContent = label;
    }
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  });
}
