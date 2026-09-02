/**
 * Mirrors the backend's `LatestOdometerResponse`: the most recent mileage reading across a
 * record set, together with the date it was recorded on.
 */
export interface LatestOdometer {
  mileage: number;
  date: string;
}
