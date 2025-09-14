import ListGroup from "./components/ListGroup";
import { useState } from "react";
import { useCities } from "./hooks/useCities";
import AddCityForm from "./components/AddCityForm";
import type { City } from "./utils";
import DeletionToast from "./components/DeletionToast"; // Import the toast
import { AnimatePresence } from "framer-motion"; // Import AnimatePresence

function App() {
  const { cities, handleSelectItem, addCity, deleteCity } = useCities();
  const [showToast, setShowToast] = useState(false);

  const HandleAddCity = (newCity: City) => {
    addCity(newCity);
  };
  const handleCityDelete = (id: number) => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      deleteCity(id);
    }, 3000);
  };

  return (
    <div className="bg-slate-900 text-white min-h-screen p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">
          Welcome to the City List App
        </h1>
        <p>Click on a city to select it.</p>
        <AddCityForm onAddCity={HandleAddCity} />

        <ListGroup
          cities={cities}
          onSelectedItem={handleSelectItem}
          onCityDelete={handleCityDelete}
        />
      </div>
      <AnimatePresence>{showToast && <DeletionToast />}</AnimatePresence>
    </div>
  );
}
export default App;
