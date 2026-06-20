const normalize = (value) => String(value || "").trim().toLowerCase();

const getDistanceScore = (distanceKm) => {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return 0;

  const distance = Number(distanceKm);

  if (distance <= 15) return 60;
  if (distance <= 25) return 30;
  if (distance <= 39) return 10;
  return 0;
};

const getExperienceScore = (user) => {
  const experience = normalize(user.experience_level);

  if (
    experience.includes("high") ||
    experience.includes("experienced") ||
    experience.includes("bee") ||
    user.has_beekeeping_experience === true
  ) {
    return 60;
  }

  return 40;
};

const getTrainingScore = (user) => {
  return user.has_training === true || user.has_guidance === true ? 100 : 0;
};

const getHeightLicenseScore = (user) => {
  return user.has_height_license === true ? 100 : 0;
};

const getPreviousCaseScore = (user) => {
  const rescues = Number(user.total_rescues || 0);
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
      const distanceScore = getDistanceScore(user.distance_km);
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