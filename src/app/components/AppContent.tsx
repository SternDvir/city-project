"use client";
import ListGroup from "./ListGroup";
import { useMemo, useState, useRef, useCallback } from "react";
import { useCities } from "@/hooks/useCities";
import AddCityForm from "./AddCityForm";
import type { City } from "@/utils";
import DeletionToast from "./DeletionToast"; // Import the toast
import { AnimatePresence, motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";

function AppContent() {
  const { cities, error, isLoading, addCity, deleteCity } = useCities();
  const [showToast, setShowToast] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const deletionTimeoutRef = useRef<number | null>(null);
  const [selctedID, setSelectedID] = useState<number | null>(null);
  const filteredCities = useMemo(() => {
    if (searchTerm === "") {
      return cities;
    }
    return cities.filter((city) =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cities, searchTerm]);

  const handleAddCity = useCallback(
    (newCity: Omit<City, "ID">) => {
      addCity(newCity);
    },
    [addCity]
  );
  const handleCitySelect = (id: number) => {
    setSelectedID((prevID) => (prevID === id ? null : id));
  };
  const handleCityDelete = useCallback(() => {
    if (selctedID === null) return;
    if (deletionTimeoutRef.current) {
      clearTimeout(deletionTimeoutRef.current);
    }

    setShowToast(true);
    deletionTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
      deleteCity(selctedID);
      setSelectedID(null);
      deletionTimeoutRef.current = null;
    }, 3000);
  }, [selctedID, deleteCity]);

  const handleCancelDelete = useCallback(() => {
    if (deletionTimeoutRef.current) {
      clearTimeout(deletionTimeoutRef.current!);
      setShowToast(false);
      deletionTimeoutRef.current = null;
    }
  }, []);

  return (
    <>
      <p className="text-xl mb-3 text-center">
        Add a new city using the form below
        <br />
        Click on a city to select it
        <br /> Then click &quot;Delete Selected City&quot; to remove it
      </p>
      <AddCityForm
        onAddCity={handleAddCity}
        isLoading={isLoading}
        // citiesLength={cities === undefined ? 0 : cities.length}
      />
      <input
        type="text"
        placeholder="Search for a city..."
        className="w-full text-center p-2 mb-8 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
        value={searchTerm}
        disabled={isLoading}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setSelectedID(null);
        }}
      />
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loader">
            <LoadingSpinner />
          </motion.div>
        ) : error ? (
          <motion.p key="error" className="text-red-500 text-center">
            {error}
          </motion.p>
        ) : (
          <motion.div key="list">
            <ListGroup
              cities={filteredCities}
              selectedID={selctedID}
              onCityDelete={handleCityDelete}
              onCitySelect={handleCitySelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && <DeletionToast onCancel={handleCancelDelete} />}
      </AnimatePresence>
    </>
  );
}
export default AppContent;
