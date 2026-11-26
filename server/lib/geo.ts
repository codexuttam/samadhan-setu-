const EARTH_RADIUS_METERS = 6_371_000;

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

export interface GeofenceEvaluation {
  distanceMeters: number;
  withinGeofence: boolean;
  maxMeters: number;
}

export function evaluateGeofence(
  ticketLat: number | null | undefined,
  ticketLng: number | null | undefined,
  officerLat: number | null | undefined,
  officerLng: number | null | undefined,
  maxMeters = 250,
): GeofenceEvaluation | null {
  if (
    typeof ticketLat !== 'number' ||
    typeof ticketLng !== 'number' ||
    typeof officerLat !== 'number' ||
    typeof officerLng !== 'number' ||
    !Number.isFinite(ticketLat) ||
    !Number.isFinite(ticketLng) ||
    !Number.isFinite(officerLat) ||
    !Number.isFinite(officerLng)
  ) {
    return null;
  }

  const distanceMeters = haversineMeters(ticketLat, ticketLng, officerLat, officerLng);
  return {
    distanceMeters,
    withinGeofence: distanceMeters <= maxMeters,
    maxMeters,
  };
}
