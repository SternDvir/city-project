"use client";
import ListGroup from "./ListGroup";
import { useMemo, useState, useRef, useCallback } from "react";
import { useCities } from "@/hooks/useCities";
import AddCityForm from "./AddCityForm";
import type { City, GeocodeResult } from "@/utils";
import { api } from "@/lib/api";
import VerificationModal from "./VerificationModal";
import DeletionToast from "./DeletionToast"; // Import the toast
import { AnimatePresence, motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";
import ErrorDisplay from "./ErrorDisplay";

function AppContent() {
  const { cities, error, isLoading, addCity, deleteCity } = useCities();
  const [showToast, setShowToast] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [continentVerification, setContinentVerification] = useState("");
  const deletionTimeoutRef = useRef<number | null>(null);
  const [selctedID, setSelectedID] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<
    GeocodeResult[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCities = useMemo(() => {
    if (searchTerm === "") {
      return cities;
    }
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
        setIsModalOpen(true); // Open the modal with the results
      } catch (error) {
        console.error("Failed to verify city:", error);
        setIsVerifying(false);
        setContinentVerification("");
        // You should show an error toast here in a real app
      } finally {
        setIsVerifying(false);
      }
    },
    []
  );

  const handleCitySelection = useCallback(
    (result: GeocodeResult) => {
      // Extract the city name and continent from the verified result
      const newCity: City = {
        // Ensure the type matches the expected City type
        name: result.formatted.split(",")[0], // Get the primary name
        continent: result.components.continent || "Unknown",
        ID: result.annotations.geohash, // Use continent if available
      };
      try {
        addCity(newCity);
        setIsModalOpen(false);
      } catch (error) {
        console.error("Failed to add city:", error);
        // You should show an error toast here in a real app
      } finally {
      }
      setIsModalOpen(false);
    },
    [addCity]
  );

  const handleCitySelect = (id: string) => {
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
        onStartVerification={handleStartVerification}
        isLoading={isLoading || isVerifying}
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
        {isLoading || isVerifying ? (
          <motion.div key="loader">
            <LoadingSpinner />
          </motion.div>
        ) : error ? (
          <>
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ErrorDisplay message={error} />
            </motion.div>
            <motion.div key="list">
              <ListGroup
                cities={filteredCities}
                selectedID={selctedID}
                onCityDelete={handleCityDelete}
                onCitySelect={handleCitySelect}
              />
            </motion.div>
          </>
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
