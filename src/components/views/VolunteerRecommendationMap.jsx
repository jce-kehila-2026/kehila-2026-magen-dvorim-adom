// Volunteer recommendation map.
// Visualizes recommended volunteers based on case location and criteria.

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const CITY_COORDINATES = {
  Jerusalem: [31.7683, 35.2137],
  "Tel Aviv": [32.0853, 34.7818],
  Haifa: [32.794, 34.9896],
  "Beer Sheva": [31.2529, 34.7915],
  Rehovot: [31.8948, 34.8113],
};

function getPosition(item) {
  if (item?.location_lat && item?.location_lng) {
    return [Number(item.location_lat), Number(item.location_lng)];
  }

  if (item?.city && CITY_COORDINATES[item.city]) {
    return CITY_COORDINATES[item.city];
  }

  return null;
}

export default function VolunteerRecommendationMap({ caseData, volunteers = [] }) {
  const casePosition = getPosition(caseData);
  const volunteersWithLocation = volunteers
    .map((volunteer) => ({
      ...volunteer,
      position: getPosition(volunteer),
    }))
    .filter((volunteer) => volunteer.position);

  const center =
    casePosition ||
    volunteersWithLocation[0]?.position ||
    CITY_COORDINATES.Jerusalem;

  return (
    <div style={{ height: "220px", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {casePosition && (
          <Marker position={casePosition}>
            <Popup>
              <strong>Case location</strong>
              <br />
              {caseData?.city || "Unknown city"}
            </Popup>
          </Marker>
        )}

        {volunteersWithLocation.map((volunteer) => (
          <Marker key={volunteer.id} position={volunteer.position}>
            <Popup>
              <strong>{volunteer.full_name || volunteer.email}</strong>
              <br />
              {volunteer.city || "No city"}
              {volunteer.recommendationScore !== undefined && (
                <>
                  <br />
                  Score: {volunteer.recommendationScore}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}