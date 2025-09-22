export interface City {
  name: string;
  continent: string;
  ID: string;
}

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
