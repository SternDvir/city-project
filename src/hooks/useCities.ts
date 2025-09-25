// src/hooks/useCities.ts

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { ICity } from "@/models/City";
import mongoose from "mongoose";
import axios from "axios";

// This interface defines the shape of the city data when we CREATE it.
// It doesn't have a temporary frontend ID yet.
interface NewCityData {
  _id: string;
  name: string;
  continent: string;
}

export function useCities() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<ICity[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await api.get("/cities");
        setCities(response.data);
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError("Failed to load cities. Please check the server connection.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const addCity = useCallback(async (newCityData: NewCityData) => {
    // Optimistic UI: Use the incoming _id (geohash) for the UI update
    setCities((prev) => [...prev, { ...newCityData } as ICity]);
    setError(null);

    try {
      const response = await api.post("/cities", newCityData);
      // Replace the optimistic city with the final, saved city from the server
      setCities((prev) =>
        prev.map((city) =>
          city._id === newCityData._id ? response.data : city
        )
      );
    } catch (error) {
      console.error("Failed to add city:", error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || "Failed to add city.");
      } else {
        setError("An unexpected error occurred.");
      }
      // Rollback on failure
      setCities((prev) => prev.filter((city) => city._id !== newCityData._id));
    }
  }, []);

  const deleteCity = useCallback(
    async (id: string) => {
      const originalCities = [...cities];
      setCities((prev) => prev.filter((city) => city._id !== id));
      setError(null);

      try {
        await api.delete(`/cities/${id}`);
      } catch (error) {
        console.error("Failed to delete city:", error);
        setCities(originalCities);
      }
    },
    [cities]
  );

  return { cities, error, isLoading, addCity, deleteCity };
}
