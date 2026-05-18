export function normalizeBaseUrl(value) {
  return value.trim().replace(/\/$/, "");
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export function fetchGraph(baseUrl) {
  return requestJson(`${baseUrl}/graph`);
}

export function fetchRoute(baseUrl, source, destination) {
  return requestJson(`${baseUrl}/route?source=${source}&destination=${destination}`);
}

export function postReport(baseUrl, payload) {
  return requestJson(`${baseUrl}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}
