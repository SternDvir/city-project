// src/hooks/useCities.ts

import { useState, useEffect, useCallback, use } from "react";
import type { City } from "@/utils";
import axios from "axios";
const CITIES_STORAGE_KEY = "citiesList";

export function useCities() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]); // Start with an empty array

  // Effect for INITIAL data load (from localStorage or server)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedCities = window.localStorage.getItem(CITIES_STORAGE_KEY);
        if (storedCities && JSON.parse(storedCities).length > 0) {
          setCities(JSON.parse(storedCities));
        } else {
          const response = await axios.get("http://localhost:3001/api/cities");
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
  }, []); // Empty array ensures this runs only once on mount

  // Effect to SAVE cities to localStorage whenever they change
  useEffect(() => {
    // Only save when we are not in the initial loading state and have cities
    if (!isLoading && cities.length > 0) {
      window.localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(cities));
    }
  }, [cities, isLoading]);

  const addCity = useCallback(async (newCityData: Omit<City, "ID">) => {
    const tempID = Date.now();
    const cityWithTempID = { ...newCityData, ID: tempID };
    setCities((prev) => [...prev, cityWithTempID]); // Optimistic update

    try {
      const response = await axios.post(
        "http://localhost:3001/api/cities",
        newCityData
      );
      // Replace temp city with the real one from the server
      setCities((prev) =>
        prev.map((city) => (city.ID === tempID ? response.data : city))
      );
    } catch (error) {
      setError("Failed to add city. Reverting.");
      setCities((prev) => prev.filter((city) => city.ID !== tempID)); // Rollback
    }
  }, []);

  const deleteCity = useCallback(async (id: number) => {
    const originalCities = [...cities];
    setCities((prev) => prev.filter((city) => city.ID !== id)); // Optimistic delete

    try {
      await axios.delete(`http://localhost:3001/api/cities/${id}`);
    } catch (error) {
      setError("Failed to delete city. Reverting.");
      setCities(originalCities); // Rollback
    }
  }, []);

  return { cities, error, isLoading, addCity, deleteCity };
}
