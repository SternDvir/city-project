import { useState, useEffect } from "react";
import type { City } from "../utils";

const CITIES_STORAGE_KEY = "citiesList";

export function useCities() {
  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const [error, setError] = useState<string | null>(null); // State for fetch errors
  const [cities, setCities] = useState<City[]>(() => {
    try {
      const storedCities = window.localStorage.getItem(CITIES_STORAGE_KEY);
      console.log(storedCities);
      return storedCities ? JSON.parse(storedCities) : [];
    } catch (error) {
      console.error("Error reading from localStorage", error);
    }
  });
  useEffect(() => {
    if (cities.length === 0) {
      const fetchCities = async () => {
        try {
          const response = await fetch("http://localhost:3001/api/cities");
          if (!response.ok) {
            setError("Network response was not ok");
            throw new Error("Network response was not ok");
          }
          const data: City[] = await response.json();
          setCities(data); // Set state with fetched data
        } catch (err) {
          console.error("Failed to fetch cities:", err);
          setError("Failed to fetch cities. Please try again later.");
        } finally {
          setIsLoading(false); // Stop loading, whether success or error
        }
      };

      fetchCities();
    }
  }, []);

  useEffect(() => {
    if (!cities) return;
    try {
      window.localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(cities));
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Simulate a short delay for loading
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [cities]);

  const addCity = (newCity: City) => {
    setCities((prevCities) => [...prevCities, newCity]);
  };
  const deleteCity = (id: number) => {
    if (id === -1) return; // Invalid ID, do nothing
    setCities((prevCities) => prevCities.filter((city) => city.ID !== id));
  };

  // The hook returns the state and the function to update it
  return { cities, error, isLoading, addCity, deleteCity };
}
