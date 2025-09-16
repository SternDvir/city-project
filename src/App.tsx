import ListGroup from "./components/ListGroup";
import { useMemo, useState, useRef } from "react";
import { useCities } from "./hooks/useCities";
import AddCityForm from "./components/AddCityForm";
import type { City } from "./utils";
import DeletionToast from "./components/DeletionToast"; // Import the toast
import { AnimatePresence } from "framer-motion";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  const { cities, error, isLoading, addCity, deleteCity } = useCities();
  const [showToast, setShowToast] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const deletionTimeoutRef = useRef<number | null>(null);

  const filteredCities = useMemo(() => {
    if (searchTerm === "") {
      return cities;
    }
    return cities.filter((city) =>
      city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cities, searchTerm]);

  const HandleAddCity = (newCity: City) => {
    addCity(newCity);
  };
  const handleCityDelete = (id: number) => {
    if (deletionTimeoutRef.current) {
      clearTimeout(deletionTimeoutRef.current);
    }
    setShowToast(true);
    deletionTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
      deleteCity(id);
      deletionTimeoutRef.current = null;
    }, 3000);
  };

  const handleCancelDelete = () => {
    if (deletionTimeoutRef.current) {
      clearTimeout(deletionTimeoutRef.current!); // Cancel the scheduled deletion
      setShowToast(false); // Hide the toast
      deletionTimeoutRef.current = null; // Clear the ref
    }
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to the City List App
        </h1>
        <p className="text-xl mb-3 text-center">
          Add a new city using the form below
          <br />
          Click on a city to select it
          <br /> Then click "Delete Selected City" to remove it
        </p>
        <AddCityForm onAddCity={HandleAddCity} />
        <input
          type="text"
          placeholder="Search for a city..."
          className="w-full text-center p-2 mb-8 bg-slate-700 rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
          value={searchTerm}
          disabled={isLoading}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <AnimatePresence>
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            <ListGroup
              cities={filteredCities}
              onCityDelete={handleCityDelete}
            />
          )}
          {showToast && <DeletionToast onCancel={handleCancelDelete} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
export default App;
