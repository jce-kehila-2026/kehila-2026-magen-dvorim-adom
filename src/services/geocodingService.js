const buildCaseAddress = (caseItem) => {
  const parts = [
    caseItem.street,
    caseItem.house_number,
    caseItem.city,
    "Israel",
  ];

  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
};

export const geocodeCaseLocation = async (caseItem) => {
  const address = buildCaseAddress(caseItem);

  console.log("Geocoding address:", address);

  if (!address) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&q=${encodeURIComponent(
    address
  )}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      console.warn("Geocoding response failed:", response.status);
      return null;
    }

    const data = await response.json();

    console.log("Geocoding result:", data);

    if (!data.length) return null;

    return {
      location_lat: Number(data[0].lat),
      location_lng: Number(data[0].lon),
      location_display_name: data[0].display_name,
    };
  } catch (err) {
    console.warn("Geocoding request failed:", err);
    return null;
  }
};