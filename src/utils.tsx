export interface GeocodeResult {
  formatted: string;
  components: {
    country?: string;
    continent?: string;
  };
  annotations: {
    geohash: string;
  };
}
