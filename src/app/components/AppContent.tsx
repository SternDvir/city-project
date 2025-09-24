"use client";
import ListGroup from "./ListGroup";
import { useMemo, useState, useRef, useCallback } from "react";
import { useCities } from "@/hooks/useCities";
import AddCityForm from "./AddCityForm";
import type { GeocodeResult } from "@/utils";
import { api } from "@/lib/api";
import VerificationModal from "./VerificationModal";
import DeletionToast from "./DeletionToast";
import { AnimatePresence, motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";
import ErrorDisplay from "./ErrorDisplay";
import { ICity } from "@/models/City"; // Import the correct city type

function AppContent() {
  const { cities, error, isLoading, addCity, deleteCity } = useCities();
  const [showToast, setShowToast] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [continentVerification, setContinentVerification] = useState("");
  const deletionTimeoutRef = useRef<number | null>(null);
  // --- STATE UPDATE: Use string for _id ---
  const [selectedID, setSelectedID] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<
    GeocodeResult[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCities = useMemo(() => {
    if (searchTerm === "") return cities;
    return cities.filter((city) =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cities, searchTerm]);

  const handleStartVerification = useCallback(
    async (cityName: string, continent: string) => {
      setIsVerifying(true);
      setContinentVerification(continent);
      try {
        const response = await api.get("/geocode", {
          params: { query: cityName },
        });
        setVerificationResults(response.data);
        setIsModalOpen(true);
      } catch (error) {
        console.error("Failed to verify city:", error);
      } finally {
        setIsVerifying(false);
      }
    },
    []
  );

  const handleCitySelection = useCallback(
    (result: GeocodeResult) => {
      // This creates a simple object that matches the `NewCityData` interface
      const newCity = {
        _id: result.annotations.geohash, // Use geohash as the unique ID
        name: result.formatted.split(",")[0],
        continent: result.components.continent || "Unknown",
      };
      addCity(newCity);
      setIsModalOpen(false);
    },
    [addCity]
  );

  // --- HANDLER UPDATE: Use string for _id ---
  const handleCitySelect = (id: string) => {
    setSelectedID((prevID) => (prevID === id ? null : id));
  };

  const handleCityDelete = useCallback(() => {
    if (selectedID === null) return;
    if (deletionTimeoutRef.current) {
      clearTimeout(deletionTimeoutRef.current);
    }
    setShowToast(true);
    deletionTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
      deleteCity(selectedID);
      setSelectedID(null);
    }, 3000);
  }, [selectedID, deleteCity]);

  const handleCancelDelete = useCallback(() => {
    if (deletionTimeoutRef.current) {
      clearTimeout(deletionTimeoutRef.current);
      setShowToast(false);
    }
  }, []);

  return (
    <>
      <p className="text-xl mb-3 text-center">
        Add a new city, or click one to select it.
      </p>
      <AddCityForm
        onStartVerification={handleStartVerification}
        isLoading={isLoading || isVerifying}
      />
      <input
        type="text"
        placeholder="Search for a city..."
        className="w-full text-center p-2 mb-8 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
        value={searchTerm}
        disabled={isLoading}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loader">
            <LoadingSpinner />
          </motion.div>
        ) : error ? (
          <motion.div key="error">
            <ErrorDisplay message={error} />
          </motion.div>
        ) : (
          <motion.div key="list">
            <ListGroup
              cities={filteredCities}
              selectedID={selectedID}
              onCityDelete={handleCityDelete}
              onCitySelect={handleCitySelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showToast && <DeletionToast onCancel={handleCancelDelete} />}
      </AnimatePresence>
      <AnimatePresence>
        {isModalOpen && (
          <VerificationModal
            results={verificationResults}
            continent={continentVerification}
            onClose={() => setIsModalOpen(false)}
            onSelect={handleCitySelection}
          />
        )}
      </AnimatePresence>
    </>
  );
}
export default AppContent;
