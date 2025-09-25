"use client";

import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";

interface AddCityFormProps {
  isLoading: boolean;
  onStartVerification: (cityName: string, continent: string) => void; // Update prop
}

export default function AddCityForm({
  isLoading,
  onStartVerification,
}: AddCityFormProps) {
  const [cityName, setCityName] = useState("");
  const [continent, setContinent] = useState("");
  // const [showWarning, setShowWarning] = useState(false);
  const cityNameRef = useRef<HTMLInputElement>(null);
  // const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (cityNameRef.current) {
      cityNameRef.current.focus();
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!cityName) return;

    onStartVerification(cityName, continent); // Call the new handler
    setCityName("");
    setContinent(""); // Clear the input
  };
  const disabledStyles = isLoading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <h3 className="text-lg font-bold mb-4 text-center">Add a New City</h3>
      <div className="mb-4">
        <input
          ref={cityNameRef}
          type="text"
          value={cityName}
          onChange={(e) => setCityName(e.target.value)}
          placeholder="City Name"
          disabled={isLoading}
          className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={continent}
          onChange={(e) => setContinent(e.target.value)}
          placeholder="Continent"
          disabled={isLoading}
          className="w-full p-2 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <Button
        type="submit"
        className={`w-full ${disabledStyles}`}
        disabled={isLoading}
      >
        Add City
      </Button>
      {/* {showWarning && (
        <p className="text-yellow-400 text-center mt-2 text-sm">
          Please wait for initial data to load before adding a new city.
        </p>
      )} */}
    </form>
  );
}
