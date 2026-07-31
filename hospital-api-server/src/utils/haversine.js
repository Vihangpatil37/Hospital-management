// Haversine formula to calculate distance between two coordinates in meters
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (degree) => (degree * Math.PI) / 180;
  
  const p1 = toRadians(lat1);
  const p2 = toRadians(lat2);
  const dp = toRadians(lat2 - lat1);
  const dl = toRadians(lon2 - lon1);

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

module.exports = { haversineDistance };
