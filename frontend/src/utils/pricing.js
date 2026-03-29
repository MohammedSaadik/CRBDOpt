/**
 * Calculate the estimated cost for a delivery based on distance.
 * 
 * Logic:
 * 1. Haversine distance between pickup and dropoff coordinates in km.
 * 2. Tortuosity Factor: 1.4 (to estimate actual road distance).
 * 3. Base Rate: 75 LKR per km.
 */

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const calculateEstimatedCost = (pickup_loc, dropoff_loc) => {
  if (!pickup_loc || !dropoff_loc || !pickup_loc.lat || !dropoff_loc.lat) {
    return 0;
  }

  const straightLineDistance = haversineDistance(
    pickup_loc.lat, pickup_loc.lng,
    dropoff_loc.lat, dropoff_loc.lng
  );

  const TORTUOSITY_FACTOR = 1.4;
  const RATE_PER_KM = 35; // LKR

  const estimatedRoadDistance = straightLineDistance * TORTUOSITY_FACTOR;
  const cost = estimatedRoadDistance * RATE_PER_KM;

  // Ensure minimum cost (e.g. 150 LKR minimum base) and round to nearest integer
  return Math.max(150, Math.round(cost));
};
