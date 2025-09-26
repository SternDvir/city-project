// src/hooks/useCities.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import type { ICity } from "@/models/City";
import axios from "axios";

// This interface defines the shape of the city data when we CREATE it.
interface NewCityData {
  _id: string;
  name: string;
  continent: string;
  country: string;
}

export function useCities() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<ICity[]>([]);
  const pollingIntervalRef = useRef<number | null>(null);

  const fetchCities = useCallback(async () => {
    try {
      const response = await api.get("/cities");
      setCities(response.data);
      // Check if we need to continue polling
      const isStillPending = response.data.some(
        (city: ICity) => city.status === "pending"
      );
      if (!isStillPending && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return response.data;
    } catch (err) {
      console.error("Failed to fetch cities:", err);
      setError("Failed to load cities. Please check the server connection.");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return [];
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchCities();
      setIsLoading(false);
    };
    loadInitialData();

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchCities]);

  const startPolling = useCallback(() => {
    // If polling is already active, don't start another one
    if (pollingIntervalRef.current) return;

    pollingIntervalRef.current = window.setInterval(() => {
      console.log("Polling for city status updates...");
      fetchCities();
    }, 5000); // Poll every 5 seconds
  }, [fetchCities]);

  const addCity = useCallback(
    async (newCityData: NewCityData) => {
      // The new city will have a 'pending' status by default from the backend
      const optimisticCity: ICity = {
        ...newCityData,
        status: "pending",
      } as ICity;

      setCities((prev) => [...prev, optimisticCity]);
      setError(null);
      startPolling(); // Start polling immediately after adding a city

      try {
        const response = await api.post("/cities", newCityData);

        // Immediately trigger the AI generation
        fetch(`/api/cities/${encodeURIComponent(response.data._id)}/generate`, {
          method: "POST",
          cache: "no-store",
        });

        // Replace the optimistic city with the final one from the server
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
        setCities((prev) =>
          prev.filter((city) => city._id !== newCityData._id)
        );
      }
    },
    [startPolling]
  );

  const reGenerateCity = useCallback(
    async (id: string) => {
      try {
        setCities((prevCities) =>
          prevCities.map((city) =>
            city._id === id
              ? ({ ...city, status: "pending", error: null } as ICity)
              : city
          )
        );
        // const response = await api.post("/cities", newCityData);
        startPolling();
        // Immediately trigger the AI generation
        fetch(`/api/cities/${encodeURIComponent(id)}/generate`, {
          method: "POST",
          cache: "no-store",
        });
      } catch (error) {
        console.error("Failed to add city:", error);
      }
    },
    [startPolling]
  );

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

  return { cities, error, isLoading, addCity, deleteCity, reGenerateCity };
}
