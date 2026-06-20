// Interactive map component.
// Displays rescue cases with valid coordinates on a map.
import { useEffect, useMemo } from "react";
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
  if (
    caseItem.location_lat == null ||
    caseItem.location_lng == null ||
    caseItem.location_lat === "" ||
    caseItem.location_lng === ""
  ) {
    return null;
  }

  const lat = Number(caseItem.location_lat);
  const lng = Number(caseItem.location_lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
};

const getMarkerStyle = (caseItem) => {
  if (caseItem.status === "open") {
    return { color: "#d97706", fillColor: "#f59e0b" };
  }

  if (caseItem.status === "assigned") {
    return { color: "#15803d", fillColor: "#22c55e" };
  }

  return { color: "#6b7280", fillColor: "#9ca3af" };
};

const getMarkerRadius = (caseItem) => {
  if (caseItem.urgency === "high") return 16;
  if (caseItem.urgency === "medium") return 12;
  if (caseItem.urgency === "low") return 9;

  return 10;
};

function FitMapToCases({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) {
      map.setView(DEFAULT_CENTER, 8);
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], 10);
      return;
    }

    map.fitBounds(positions, {
      padding: [55, 55],
      maxZoom: 11,
      animate: true,
      duration: 0.8,
    });
  }, [positions, map]);

  return null;
}

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
        click: () => {
          const popupOffsetPosition = [
            position[0] + 0.0012,
            position[1],
          ];

          map.flyTo(popupOffsetPosition, 14, { duration: 0.9 });
        },
      }}
    >
      <Popup>
        <div style={{ minWidth: "210px" }}>
          <strong>
            {caseItem.requester_first_name} {caseItem.requester_last_name}
          </strong>

          <div style={{ marginTop: "8px", lineHeight: "1.7" }}>
            <div>Status: {caseItem.status || "Not specified"}</div>
            <div>Urgency: {caseItem.urgency || "Not specified"}</div>
            <div>
              Address: {caseItem.street || ""} {caseItem.house_number || ""},{" "}
              {caseItem.city || ""}
            </div>
            <div>Phone: {caseItem.requester_phone || "Not specified"}</div>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

const statusOptions = [
  {
    value: "all",
    label: "All",
    activeColor: "#ffffff",
    inactiveColor: "#1f697a",
    activeBackground: "#6191a5",
  },
  {
    value: "open",
    label: "Open",
    activeColor: "#ffffff",
    activeBackground: "#f59e0b",
    inactiveColor: "#b45309",
  },
  {
    value: "assigned",
    label: "Assigned",
    activeColor: "#ffffff",
    activeBackground: "#249a4f",
    inactiveColor: "#15803d",
  },
];

export default function AssignedCasesMap({ cases = [] }) {
  const visibleCases = useMemo(() => {
    return cases.filter((caseItem) => {
      return caseItem.status === "open" || caseItem.status === "assigned";
    });
  }, [cases]);

  const mappedCases = useMemo(() => {
    return visibleCases.filter((caseItem) => getCasePosition(caseItem));
  }, [visibleCases]);

  const positions = useMemo(() => {
    return mappedCases.map((caseItem) => getCasePosition(caseItem));
  }, [mappedCases]);

  const unmappedCount = visibleCases.length - mappedCases.length;

 return (
  <div style={{ height: "100%", width: "100%" }}>
    <div
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "18px",
        overflow: "hidden",
        border: "2px solid #ffe082",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={8}
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