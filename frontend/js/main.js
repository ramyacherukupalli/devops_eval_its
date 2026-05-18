import { fetchGraph, fetchRoute, postReport } from "./api.js";
import { getNodeName } from "./constants.js";
import { clearRouteSelection, initMap, renderGraph, updateRouteLine } from "./mapView.js";

const routeForm = document.getElementById("route-form");
const reportForm = document.getElementById("report-form");
const sourceSelect = document.getElementById("source-select");
const destinationSelect = document.getElementById("destination-select");
const reportFrom = document.getElementById("report-from");
const reportTo = document.getElementById("report-to");
const severityRange = document.getElementById("severity");
const severityValue = document.getElementById("severity-value");
const severityLevel = document.getElementById("severity-level");
const routeSummaryText = document.querySelector(".summary-text");
const routeDetails = document.getElementById("route-details");
const reportResult = document.getElementById("report-result");
const routePath = document.getElementById("route-path");
const routeCost = document.getElementById("route-cost");
const routeTraffic = document.getElementById("route-traffic");
const routeAvoided = document.getElementById("route-avoided");
const routeAvoidedRow = document.getElementById("route-avoided-row");
const routeTip = document.getElementById("route-tip");
const routeMapHint = document.getElementById("route-map-hint");
const routeRecalc = document.getElementById("route-recalc");
const routeButton = routeForm.querySelector("button[type=submit]");
const reportButton = reportForm.querySelector("button[type=submit]");
const resetButton = document.getElementById("reset-view");

const API_BASE_URL = "http://localhost:5000";
let cachedGraph = null;
let congestionUpdated = false;
let lastRouteRequest = null;

function populateSelects(nodes) {
  const selectConfigs = [
    { element: sourceSelect, placeholder: "Select source" },
    { element: destinationSelect, placeholder: "Select destination" },
    { element: reportFrom, placeholder: "Select from" },
    { element: reportTo, placeholder: "Select to" }
  ];

  selectConfigs.forEach(({ element, placeholder }) => {
    element.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    element.appendChild(placeholderOption);

    nodes.forEach((node) => {
      const option = document.createElement("option");
      option.value = node;
      option.textContent = getNodeName(node);
      element.appendChild(option);
    });
  });
}

function updateRouteSummary(result) {
  const labeledPath = formatRoutePath(result.path);
  const routeRatio = computeRouteRatio(result.edges || []);
  const trafficStatus = getRatioTrafficLevel(routeRatio ?? 1);
  const avoided = getAvoidedCongestion(result.edges || []);

  routeSummaryText.textContent = "Route found.";
  routePath.innerHTML = labeledPath || "-";
  routeCost.textContent = `${Number(result.total_cost).toFixed(2)} mins (estimated)`;
  routeTraffic.textContent = trafficStatus;
  routeTraffic.className = `traffic-pill ${trafficStatus.toLowerCase()}`;
  if (avoided && avoided !== "None") {
    routeAvoidedRow.style.display = "flex";
    routeAvoided.textContent = avoided;
  } else {
    routeAvoidedRow.style.display = "none";
    routeAvoided.textContent = "";
  }
  routeTip.textContent = "💡 Route optimized to avoid congestion.";
  routeMapHint.textContent = "👉 Route highlighted on map in blue.";
  routeRecalc.style.display = congestionUpdated ? "block" : "none";
  congestionUpdated = false;
}

function setRouteError(message) {
  routeSummaryText.textContent = message;
  routePath.textContent = "-";
  routeCost.textContent = "-";
  routeTraffic.textContent = "-";
  routeTraffic.className = "traffic-pill";
  routeAvoided.textContent = "-";
  routeAvoidedRow.style.display = "none";
  routeRecalc.style.display = "none";
  routeMapHint.textContent = "";
  routeTip.textContent = "";
}

async function loadGraph() {
  const baseUrl = API_BASE_URL;
  try {
    const graph = await fetchGraph(baseUrl);
    cachedGraph = graph;
    renderGraph(graph);
    populateSelects(graph.nodes);
  } catch (error) {
    routeSummaryText.textContent = "Backend unreachable. Start the Flask server.";
  }
}

async function handleRouteSubmit(event) {
  event.preventDefault();
  const source = sourceSelect.value;
  const destination = destinationSelect.value;
  const baseUrl = API_BASE_URL;

  if (source === destination) {
    setRouteError("Select different nodes for source and destination.");
    return;
  }

  try {
    setLoading(routeButton, true, "Computing...");
    routeSummaryText.textContent = "Finding best route...";
    const result = await fetchRoute(baseUrl, source, destination);
    lastRouteRequest = { source, destination };
    updateRouteSummary(result);
    updateRouteLine(result.path, result.edges, {
      source: result.source,
      destination: result.destination,
      totalCost: result.total_cost
    });
  } catch (error) {
    setRouteError("Unable to compute route. Check the backend connection.");
  } finally {
    setLoading(routeButton, false, "Compute Route");
  }
}

async function handleReportSubmit(event) {
  event.preventDefault();
  const from = reportFrom.value;
  const to = reportTo.value;
  const severity = Number(severityRange.value);
  const baseUrl = API_BASE_URL;

  if (from === to) {
    reportResult.textContent = "Select two different nodes.";
    return;
  }

  try {
    setLoading(reportButton, true, "Reporting...");
    const updated = await postReport(baseUrl, { from, to, severity });
    const severityStatus = getSeverityLevel(severity);
    reportResult.textContent = `Traffic updated. Road: ${updated.from} \u2192 ${updated.to}. Severity: ${severity} (${severityStatus}).`;
    reportResult.classList.add("success");
    congestionUpdated = true;
    await loadGraph();
    if (lastRouteRequest) {
      const refreshed = await fetchRoute(
        baseUrl,
        lastRouteRequest.source,
        lastRouteRequest.destination
      );
      updateRouteSummary(refreshed);
      updateRouteLine(refreshed.path, refreshed.edges, {
        source: refreshed.source,
        destination: refreshed.destination,
        totalCost: refreshed.total_cost
      });
    }
  } catch (error) {
    reportResult.textContent = "Unable to submit report. Check the backend.";
    reportResult.classList.remove("success");
  } finally {
    setLoading(reportButton, false, "Report Congestion");
  }
}

function getTrafficLevel(value) {
  if (value <= 1.2) return "LOW";
  if (value <= 2) return "MEDIUM";
  return "HIGH";
}

function getSeverityLevel(value) {
  if (value <= 5) return "LOW";
  if (value <= 10) return "MEDIUM";
  return "HIGH";
}

function getRatioTrafficLevel(ratio) {
  return getTrafficLevel(ratio);
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

function formatRoutePath(path) {
  if (!path || !path.length) return "-";
  return path
    .map((node, index) => {
      const icon = index === 0 ? "📍" : index === path.length - 1 ? "🎯" : "🚗";
      return `<span class="route-node">${icon} ${getNodeName(node)}</span>`;
    })
    .join("<span class=\"route-arrow\">→</span>");
}

function getAvoidedCongestion(routeEdges) {
  if (!cachedGraph || !cachedGraph.edges) return "Unknown";
  const routeEdgeIds = new Set(routeEdges.map((edge) => edge.id));
  const avoidedEdges = cachedGraph.edges.filter(
    (edge) => {
      const baseValue = Number(edge.base_weight ?? 0);
      const currentValue = Number(edge.current_weight ?? 0);
      const ratio = baseValue > 0 ? currentValue / baseValue : 1;
      return getTrafficLevel(ratio) === "HIGH" && !routeEdgeIds.has(edge.id);
    }
  );

  if (!avoidedEdges.length) return "None";
  const sample = avoidedEdges.slice(0, 2).map((edge) => `${edge.from} \u2192 ${edge.to}`);
  return sample.join(", ");
}

function setLoading(button, isLoading, label) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = label;
}

severityRange.addEventListener("input", () => {
  severityValue.textContent = severityRange.value;
  severityLevel.textContent = getSeverityLevel(Number(severityRange.value));
});

resetButton.addEventListener("click", () => {
  window.location.reload();
});

routeForm.addEventListener("submit", handleRouteSubmit);
reportForm.addEventListener("submit", handleReportSubmit);

initMap();
loadGraph();
severityLevel.textContent = getSeverityLevel(Number(severityRange.value));
severityValue.textContent = severityRange.value;
