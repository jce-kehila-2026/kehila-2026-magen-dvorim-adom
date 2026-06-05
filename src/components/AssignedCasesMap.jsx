import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const cityCoordinates = {
  Jerusalem: [31.7683, 35.2137],
  Haifa: [32.794, 34.9896],
  "Tel Aviv": [32.0853, 34.7818],
  Beersheba: [31.252973, 34.791462],
  Nazareth: [32.6996, 35.3035],
};

const formatCityName = (city) =>
  city
    ? city
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

const getMarkerStyle = (caseItem) => {
  if (caseItem.case_complexity === "very complex") {
    return { color: "#c62828", fillColor: "#ef5350" };
  }

  if (caseItem.case_complexity === "complex") {
    return { color: "#ef6c00", fillColor: "#ff9800" };
  }

  if (caseItem.status === "open") {
    return { color: "#f9a825", fillColor: "#ffeb3b" };
  }

  if (caseItem.status === "assigned") {
    return { color: "#2e7d32", fillColor: "#66bb6a" };
  }

  if (caseItem.status === "closed") {
    return { color: "#424242", fillColor: "#757575" };
  }

  return { color: "#f57c00", fillColor: "#ff9800" };
};

const statusOptions = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "closed", label: "Closed" },
];

function ZoomToCaseMarker({ caseItem, position }) {
  const map = useMap();

  return (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{
        ...getMarkerStyle(caseItem),
        fillOpacity: 0.85,
      }}
      eventHandlers={{
        click: () => {
          map.flyTo(position, 13, { duration: 1 });
        },
      }}
    >
      <Popup>
        <strong>
          {caseItem.requester_first_name} {caseItem.requester_last_name}
        </strong>
        <br />
        Status: {caseItem.status || "Not specified"}
        <br />
        Complexity: {caseItem.case_complexity || "Not specified"}
        <br />
        City: {caseItem.city || "Not specified"}
        <br />
        Street: {caseItem.street || "Not specified"}
        <br />
        Phone: {caseItem.requester_phone || "Not specified"}
      </Popup>
    </CircleMarker>
  );
}

export default function AssignedCasesMap({ cases = [], defaultFilter = "all" }) {
  const [statusFilter, setStatusFilter] = useState(defaultFilter);

  const visibleCases = cases.filter((caseItem) => {
    if (!["open", "assigned", "closed"].includes(caseItem.status)) return false;
    if (statusFilter === "all") return true;
    return caseItem.status === statusFilter;
  });

  const mappedCases = visibleCases.filter(
    (caseItem) => cityCoordinates[formatCityName(caseItem.city)]
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              border: "1px solid #c8e6c9",
              background: statusFilter === option.value ? "#1f7a5c" : "#ffffff",
              color: statusFilter === option.value ? "#ffffff" : "#1f7a5c",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#5f6f68",
          marginTop: 0,
          marginBottom: "12px",
          fontSize: "0.95em",
        }}
      >
        Showing {mappedCases.length} case{mappedCases.length !== 1 ? "s" : ""} on the map.
      </p>

      <div
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          marginTop: "20px",
          border: "2px solid #ffe082",
        }}
      >
        <MapContainer
          center={[31.7683, 35.2137]}
          zoom={8}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mappedCases.map((caseItem) => {
            const position = cityCoordinates[formatCityName(caseItem.city)];

            return (
              <ZoomToCaseMarker
                key={caseItem.id}
                caseItem={caseItem}
                position={position}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}