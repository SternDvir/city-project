// src/hooks/useCities.ts

import { useState, useEffect, useCallback } from "react";
import type { City } from "@/utils";
import { api } from "@/lib/api";

export function useCities() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);

  // Effect for INITIAL data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await api.get("/cities");
        setCities(response.data);
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load cities. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const addCity = useCallback(async (newCityData: City) => {
    const tempID = Date.now().toString();
    const cityWithTempID = { ...newCityData, ID: tempID };
    setCities((prev) => [...prev, cityWithTempID]);

    try {
      // Use the api instance and relative path
      const response = await api.post("/cities", newCityData);
      setCities((prev) =>
        prev.map((city) => (city.ID === tempID ? response.data : city))
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log("Failed to add city:", error);
      setError(
        "Failed to add city: " +
          newCityData.name +
          " - " +
          newCityData.continent +
          " already exists in the list."
      );
      setCities((prev) => prev.filter((city) => city.ID !== tempID));
    }
  }, []);

  const deleteCity = useCallback(
    async (id: string) => {
      const originalCities = [...cities];
      setCities((prev) => prev.filter((city) => city.ID !== id));

      try {
        // Use the api instance and relative path
        await api.delete(`/cities/${id}`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setError("Failed to delete city. Reverting.");
        setCities(originalCities);
      }
    },
    [cities]
  );

  return { cities, error, isLoading, addCity, deleteCity };
}
