import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [31.7683, 35.2137]; // Jerusalem

const getCasePosition = (caseItem) => {
  const lat = Number(caseItem.location_lat);
  const lng = Number(caseItem.location_lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
};

const getMarkerStyle = (caseItem) => {
  // Priority first
  if (caseItem.urgency === "high") {
    return { color: "#b71c1c", fillColor: "#e53935" };
  }

  if (caseItem.urgency === "medium") {
    return { color: "#ef6c00", fillColor: "#ff9800" };
  }

  if (caseItem.urgency === "low") {
    return { color: "#1b5e20", fillColor: "#4caf50" };
  }

  // Fallback to status
  if (caseItem.status === "open") {
    return { color: "#1565c0", fillColor: "#42a5f5" };
  }

  if (caseItem.status === "assigned") {
    return { color: "#6a1b9a", fillColor: "#ab47bc" };
  }

  if (caseItem.status === "closed") {
    return { color: "#424242", fillColor: "#9e9e9e" };
  }

  return { color: "#1976d2", fillColor: "#64b5f6" };
};

function FitMapToCases({ positions }) {
  const map = useMap();

  useMemo(() => {
    if (!positions.length) return;

    if (positions.length === 1) {
      map.setView(positions[0], 13);
      return;
    }

    map.fitBounds(positions, { padding: [40, 40] });
  }, [positions, map]);

  return null;
}
const getMarkerRadius = (caseItem) => {
  if (caseItem.urgency === "high") return 16;
  if (caseItem.urgency === "medium") return 12;
  if (caseItem.urgency === "low") return 8;

  return 10;
};

function CaseMarker({ caseItem, position }) {
  const map = useMap();
   
  return (
    <CircleMarker
      center={position}
      radius={getMarkerRadius(caseItem)}
      pathOptions={{
        ...getMarkerStyle(caseItem),
        fillOpacity: 0.9,
        weight: 3,
      }}
      eventHandlers={{
        click: () => map.flyTo(position, 14, { duration: 1 }),
      }}
    >
      <Popup>
        <strong>
          {caseItem.requester_first_name} {caseItem.requester_last_name}
        </strong>
        <br />
       Status: {caseItem.status || "Not specified"}
        <br />
        Urgency: {caseItem.urgency || "Not specified"}
        <br />
        Complexity: {caseItem.case_complexity || "Not specified"}
        <br />
        Address: {caseItem.street || ""} {caseItem.house_number || ""},{" "}
        {caseItem.city || ""}
        <br />
        Phone: {caseItem.requester_phone || "Not specified"}
        <br />
        <br />
        <a
          href={`https://www.google.com/maps?q=${caseItem.location_lat},${caseItem.location_lng}`}
          target="_blank"
          rel="noreferrer"
        >
          📍 Open in Google Maps
        </a>
      </Popup>
    </CircleMarker>
  );
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "closed", label: "Closed" },
];

export default function AssignedCasesMap({ cases = [], defaultFilter = "all" }) {
  const [statusFilter, setStatusFilter] = useState(defaultFilter);

  const visibleCases = cases.filter((caseItem) => {
    if (statusFilter === "all") return true;
    return caseItem.status === statusFilter;
  });
  const highCases = visibleCases.filter((c) => c.urgency === "high").length;
  const mediumCases = visibleCases.filter((c) => c.urgency === "medium").length;
  const lowCases = visibleCases.filter((c) => c.urgency === "low").length;

  const mappedCases = visibleCases.filter((caseItem) => getCasePosition(caseItem));
  const unmappedCount = visibleCases.length - mappedCases.length;
  const positions = mappedCases.map((caseItem) => getCasePosition(caseItem));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "1px solid #c8e6c9",
              background: statusFilter === option.value ? "#1f7a5c" : "#fff",
              color: statusFilter === option.value ? "#fff" : "#1f7a5c",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p style={{ textAlign: "center", color: "#5f6f68" }}>
        Showing {mappedCases.length} case{mappedCases.length !== 1 ? "s" : ""} on the map.
        {unmappedCount > 0 && ` ${unmappedCount} case(s) have no location coordinates.`}
      </p>
       
      <div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
    margin: "12px 0 18px",
    fontWeight: "bold",
    color: "#173b2f",
  }}
>
  <span>🔴 High: {highCases}</span>
  <span>🟠 Medium: {mediumCases}</span>
  <span>🟢 Low: {lowCases}</span>
</div>
  
      <div
        style={{
          height: "420px",
          width: "100%",
          borderRadius: "18px",
          overflow: "hidden",
          border: "2px solid #ffe082",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <MapContainer
          center={positions[0] || DEFAULT_CENTER}
          zoom={positions.length ? 12 : 8}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitMapToCases positions={positions} />

          {mappedCases.map((caseItem) => (
            <CaseMarker
              key={caseItem.id}
              caseItem={caseItem}
              position={getCasePosition(caseItem)}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}