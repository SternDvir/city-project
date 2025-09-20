// src/hooks/useCities.ts

import { useState, useEffect, useCallback } from "react";
import type { City } from "@/utils";
// Remove the direct axios import
// import axios from "axios";
// Your custom api instance is already set up for relative paths
import { api } from "@/lib/api";

const CITIES_STORAGE_KEY = "citiesList";

export function useCities() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);

  // Effect for INITIAL data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedCities = window.localStorage.getItem(CITIES_STORAGE_KEY);
        if (storedCities && JSON.parse(storedCities).length > 0) {
          setCities(JSON.parse(storedCities));
        } else {
          // Use the api instance and relative path
          const response = await api.get("/cities");
          setCities(response.data);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load cities. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Effect to SAVE cities to localStorage
  useEffect(() => {
    if (!isLoading && cities.length > 0) {
      window.localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(cities));
    }
  }, [cities, isLoading]);

  const addCity = useCallback(async (newCityData: Omit<City, "ID">) => {
    const tempID = Date.now();
    const cityWithTempID = { ...newCityData, ID: tempID };
    setCities((prev) => [...prev, cityWithTempID]);

    try {
      // Use the api instance and relative path
      const response = await api.post("/cities", newCityData);
      setCities((prev) =>
        prev.map((city) => (city.ID === tempID ? response.data : city))
      );
    } catch (error) {
      setError("Failed to add city. Reverting.");
      setCities((prev) => prev.filter((city) => city.ID !== tempID));
    }
  }, []);

  const deleteCity = useCallback(
    async (id: number) => {
      const originalCities = [...cities];
      setCities((prev) => prev.filter((city) => city.ID !== id));

      try {
        // Use the api instance and relative path
        await api.delete(`/cities/${id}`);
      } catch (error) {
        setError("Failed to delete city. Reverting.");
        setCities(originalCities);
      }
    },
    [cities]
  );

  return { cities, error, isLoading, addCity, deleteCity };
}
