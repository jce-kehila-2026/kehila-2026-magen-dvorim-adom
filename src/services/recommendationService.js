const normalize = (value) => String(value || "").trim().toLowerCase();

const CITY_COORDINATES = {
  Jerusalem: [31.7683, 35.2137],
  "Tel Aviv": [32.0853, 34.7818],
  Haifa: [32.794, 34.9896],
  "Beer Sheva": [31.2529, 34.7915],
  Rehovot: [31.8948, 34.8113],
};

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const getEntityPosition = (entity) => {
  if (entity?.location_lat && entity?.location_lng) {
    return [Number(entity.location_lat), Number(entity.location_lng)];
  }

  if (entity?.city && CITY_COORDINATES[entity.city]) {
    return CITY_COORDINATES[entity.city];
  }

  return null;
};

const getDistanceBetween = (caseItem, user) => {
  const casePosition = getEntityPosition(caseItem);
  const userPosition = getEntityPosition(user);

  if (!casePosition || !userPosition) return null;

  return haversineDistanceKm(
    casePosition[0],
    casePosition[1],
    userPosition[0],
    userPosition[1]
  );
};

const getDistanceScore = (distanceKm) => {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return 0;

  const distance = Number(distanceKm);

  if (distance <= 15) return 60;
  if (distance <= 25) return 30;
  if (distance <= 39) return 10;
  return 0;
};

const getExperienceScore = (user) => {
  const hasEvacuationExperience = user.has_evacuation_experience === true;
  const hasBreedingExperience = user.has_breeding_experience === true;

  if (hasEvacuationExperience) return 60;
  if (hasBreedingExperience) return 40;
  return 0;
};

const getTrainingScore = (user) => {
  return user.has_training === true || user.has_guidance === true ? 100 : 0;
};

const getHeightLicenseScore = (user) => {
  return user.licenses?.height_work === true ? 100 : 0;
};

const getPreviousCaseScore = (user) => {
  const rescues = Number(user.stats?.total_rescues || 0);
  return rescues === 0 ? 80 : 20;
};

export const recommendVolunteersForCase = ({
  caseItem,
  users,
  assignedUserIds = [],
}) => {
  const volunteers = users.filter(
    (user) =>
      user.role === "volunteer" &&
      !assignedUserIds.includes(user.id) &&
      user.is_available !== false
  );

  return volunteers
    .map((user) => {
      const distanceKm = user.distance_km ?? getDistanceBetween(caseItem, user);
      const distanceScore = getDistanceScore(distanceKm);
      const experienceScore = getExperienceScore(user);
      const trainingScore = getTrainingScore(user);
      const heightLicenseScore = getHeightLicenseScore(user);
      const previousCaseScore = getPreviousCaseScore(user);

      const finalScore =
        distanceScore * 0.3 +
        experienceScore * 0.25 +
        trainingScore * 0.15 +
        heightLicenseScore * 0.1 +
        previousCaseScore * 0.2;

      return {
        ...user,
        recommendationScore: Math.round(finalScore),
        recommendationDetails: {
          distanceScore,
          experienceScore,
          trainingScore,
          heightLicenseScore,
          previousCaseScore,
        },
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
};