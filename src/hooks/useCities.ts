import { useState } from "react";
import type { City } from "../utils";

export function useCities() {
  const [cities, setCities] = useState<City[]>([
    { ID: 1, name: "New York", continent: "North America" },
    { ID: 2, name: "Los Angeles", continent: "North America" },
    { ID: 3, name: "Chicago", continent: "North America" },
    { ID: 4, name: "Houston", continent: "North America" },
    { ID: 5, name: "Phoenix", continent: "North America" },
    { ID: 6, name: "Philadelphia", continent: "North America" },
  ]);

  const handleSelectItem = (selectedIndex: number) => {
    setCities((previousCities) =>
      previousCities.map((city) => {
        if (city.ID === selectedIndex) {
          return {
            ...city,
            name: city.name.includes("Selected")
              ? city.name.replace(" Selected", "")
              : `${city.name} Selected`,
          };
        }
        return city;
      })
    );
  };
  const addCity = (newCity: City) => {
    setCities((prevCities) => [...prevCities, newCity]);
  };
  const deleteCity = (id: number) => {
    if (id === -1) return; // Invalid ID, do nothing
    setCities((prevCities) => prevCities.filter((city) => city.ID !== id));
  };

  // The hook returns the state and the function to update it
  return { cities, handleSelectItem, addCity, deleteCity };
}
