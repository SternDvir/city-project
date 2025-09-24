// src/hooks/useCities.ts

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { ICity } from "@/models/City";
import mongoose from "mongoose";
import axios from "axios";

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

  const addCity = useCallback(async (newCityData: Omit<ICity, "_id">) => {
    const tempId = new mongoose.Types.ObjectId().toString();
    const cityWithTempId = { ...newCityData, _id: tempId };

    setCities((prev) => [...prev, cityWithTempId]);
    setError(null);

    try {
      const response = await api.post("/cities", newCityData);
      setCities((prev) =>
        prev.map((city) => (city._id === tempId ? response.data : city))
      );
    } catch (error) {
      console.error("Failed to add city:", error);
      // 3. Check if it's an Axios error to safely access response data
      if (axios.isAxiosError(error) && error.response) {
        setError(
          error.response.data.message ||
            "Failed to add city. It may already exist."
        );
      } else {
        setError("An unexpected error occurred while adding the city.");
      }
      setCities((prev) => prev.filter((city) => city._id !== tempId));
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
        // Same pattern for delete
        console.error("Failed to delete city:", error);
        if (axios.isAxiosError(error) && error.response) {
          setError(error.response.data.message || "Failed to delete city.");
        } else {
          setError("An unexpected error occurred while deleting the city.");
        }
        setCities(originalCities);
      }
    },
    [cities]
  );

  return { cities, error, isLoading, addCity, deleteCity };
}
