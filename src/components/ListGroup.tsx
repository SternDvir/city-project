import { useState } from "react";
import type { City } from "../utils";
import { motion, AnimatePresence } from "framer-motion";

export interface ListGroupProps {
  cities: City[];
  onCityDelete: (id: number) => void;
}

export default function ListGroup({ cities, onCityDelete }: ListGroupProps) {
  const [selectedID, setSelectedID] = useState<number | null>(null);

  const handleCityClick = (id: number) => {
    if (selectedID === id) {
      setSelectedID(null);
    } else {
      setSelectedID(id);
    }
  };
  const handleDeleteClick = () => {
    if (selectedID === null) return;
    onCityDelete(selectedID);
  };
  return (
    <>
      <h2 className="text-2xl font-bold mb-4 text-center">
        List Group Component
      </h2>
      <ul className="bg-slate-800 rounded-lg shadow-lg p-0">
        <AnimatePresence>
          {cities.map((item: City, index: number) => (
            <motion.li
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              exit={{ opacity: 0, x: -300, transition: { duration: 0.3 } }}
              className={`p-4 cursor-pointer text-center transition-colors duration-200 border-b border-slate-700 rounded-lg last:border-b-0 animate-fadeIn ${
                item.ID === selectedID
                  ? "bg-sky-500 text-white"
                  : "hover:bg-slate-700"
              }`}
              key={item.ID}
              onClick={() => handleCityClick(item.ID)}
            >
              {item.name} -{" "}
              <span className="text-slate-200">
                Continent: {item.continent}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-4 bg-red-500
    hover:bg-gradient-to-r hover:from-pink-200 hover:via-red-400 hover:to-rose-600
    bg-[length:200%_200%] bg-[position:0%_50%]
    hover:bg-[position:100%_50%]
    transition-[background-position] duration-700 ease-linear
    text-white font-bold py-2 px-4 rounded-xl"
        onClick={() => handleDeleteClick()} // Pass the ID of the active city or -1 if none is active
      >
        Delete Selected City
      </motion.button>
    </>
  );
}
