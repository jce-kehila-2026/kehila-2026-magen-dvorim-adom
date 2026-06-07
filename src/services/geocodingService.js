const buildSearchAttempts = (caseItem) => {
  return [
    // Full address
    [
      caseItem.street,
      caseItem.house_number,
      caseItem.city,
      "Israel",
    ],

    // Street + city
    [
      caseItem.street,
      caseItem.city,
      "Israel",
    ],

    // Description + city
    [
      caseItem.location_description,
      caseItem.city,
      "Israel",
    ],

    // City only
    [
      caseItem.city,
      "Israel",
    ],
  ]
    .map((parts) =>
      parts
        .map((part) => String(part || "").trim())
        .filter(Boolean)
        .join(", ")
    )
    .filter(Boolean);
};

export const geocodeCaseLocation = async (caseItem) => {
  const attempts = buildSearchAttempts(caseItem);

  for (const address of attempts) {
    console.log("Trying geocoding:", address);

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
        console.warn(
          "Geocoding response failed:",
          response.status
        );
        continue;
      }

      const data = await response.json();

      console.log(
        "Geocoding result for",
        address,
        data
      );

      if (!data.length) {
        continue;
      }

      return {
        location_lat: Number(data[0].lat),
        location_lng: Number(data[0].lon),
        location_display_name: data[0].display_name,
        location_source: address,
      };
    } catch (err) {
      console.warn(
        "Geocoding request failed for:",
        address,
        err
      );
    }
  }

  return null;
};