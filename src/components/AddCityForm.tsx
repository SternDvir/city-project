import React, { useState, useRef, useEffect } from "react";
import type { City } from "../utils";
import Button from "./Button";
import { useCities } from "../hooks/useCities";
interface AddCityFormProps {
  onAddCity: (city: City) => void;
}

export default function AddCityForm({ onAddCity }: AddCityFormProps) {
  const [cityName, setCityName] = useState("");
  const [continent, setContinent] = useState("");
  const [newCityID, setNewCityID] = useState(useCities().cities.length + 1);
  const cityNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cityNameRef.current) {
      cityNameRef.current.focus();
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!cityName || !continent) return; // Basic validation

    onAddCity({ ID: newCityID, name: cityName, continent: continent });
    setNewCityID((prevID) => prevID + 1); // Increment ID for the next city
    console.log(
      `Added city: ${cityName}, Continent: ${continent} (ID: ${newCityID})`
    );
    // Clear the form after submission
    setCityName("");
    setContinent("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <h3 className="text-2xl font-bold mb-4">Add a New City</h3>
      <div className="mb-4">
        <input
          ref={cityNameRef}
          type="text"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          placeholder="City Name"
          className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={continent}
          onChange={(e) => setContinent(e.target.value)}
          placeholder="Continent"
          className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <Button type="submit" className="w-full">
        Add City
      </Button>
    </form>
  );
}
