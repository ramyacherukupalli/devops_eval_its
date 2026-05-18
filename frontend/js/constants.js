export const nodeMeta = {
  "Koramangala": { name: "Koramangala", coords: [12.9352, 77.6245] },
  "BTM Layout": { name: "BTM Layout", coords: [12.9166, 77.6101] },
  "Indiranagar": { name: "Indiranagar", coords: [12.9716, 77.6412] },
  "MG Road": { name: "MG Road", coords: [12.9758, 77.6055] },
  "Electronic City": { name: "Electronic City", coords: [12.8399, 77.6770] },
  "Silk Board": { name: "Silk Board", coords: [12.9173, 77.6237] },
  "Whitefield": { name: "Whitefield", coords: [12.9698, 77.7500] },
  "Marathahalli": { name: "Marathahalli", coords: [12.9591, 77.6974] },
  "HSR Layout": { name: "HSR Layout", coords: [12.9116, 77.6474] },
  "Jayanagar": { name: "Jayanagar", coords: [12.9250, 77.5938] }
};

export function getNodeCoords(nodeId) {
  return nodeMeta[nodeId]?.coords || null;
}

export function getNodeName(nodeId) {
  return nodeMeta[nodeId]?.name || nodeId;
}

export function getNodeLabel(nodeId) {
  const meta = nodeMeta[nodeId];
  return meta ? `${nodeId} - ${meta.name}` : nodeId;
}
