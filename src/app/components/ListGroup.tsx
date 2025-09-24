"use client";

import React, { memo } from "react";
import { ICity } from "@/models/City";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export interface ListGroupProps {
  cities: ICity[]; // Use ICity here
  onCityDelete: () => void;
  onCitySelect: (id: string) => void;
  selectedID: string | null;
}

const ListGroup = ({
  cities,
  selectedID,
  onCitySelect,
  onCityDelete,
}: ListGroupProps) => {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4 text-center">
        List Group Component
      </h2>
      <ul className="bg-slate-800 rounded-lg shadow-lg p-0 overflow-hidden">
        {cities.map((item: ICity, index: number) => (
          // 1. Use a Fragment to group the main <li> and the details <li>
          <React.Fragment key={item._id}>
            <motion.li
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-4 cursor-pointer text-center transition-colors duration-200 border-b border-slate-700 last:border-b-0 ${
                item._id === selectedID
                  ? "bg-sky-500 text-white"
                  : "hover:bg-slate-700"
              }`}
              onClick={() => onCitySelect(item._id)}
            >
              {item.name} -{" "}
              <span className="text-slate-200">
                Continent: {item.continent}
              </span>
            </motion.li>

            {/* 2. AnimatePresence will manage the appearance of the details panel */}
            <AnimatePresence>
              {item._id === selectedID && (
                <motion.li
                  // 3. Define the animation for the expandable section
                  initial={{ opacity: 0, maxHeight: 0 }}
                  animate={{ opacity: 1, maxHeight: "500px" }} // Use a large, fixed value
                  exit={{ opacity: 0, maxHeight: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ transformOrigin: "top" }}
                  // 4. Style the new details panel as requested
                  className="bg-sky-900/50 border-b-2 border-sky-600 text-center p-4 rounded-lg"
                >
                  <p className="text-m text-slate-200 mb-3">
                    Did you know {item.name} is famous for its incredible
                    landmarks and vibrant culture?
                  </p>
                  <Link
                    href={`/cities/${encodeURIComponent(item.name)}`}
                    className="inline-block bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
                  >
                    Explore {item.name}
                  </Link>
                </motion.li>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}
      </ul>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="mt-4 bg-red-500
        hover:bg-gradient-to-r hover:from-pink-200 hover:via-red-400 hover:to-rose-600
        bg-[length:200%_200%] bg-[position:0%_50%]
        hover:bg-[position:100%_50%]
        transition-[background-position] duration-700 ease-linear
        text-white font-bold py-2 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onCityDelete}
        disabled={selectedID === null}
      >
        Delete Selected City
      </motion.button>
    </>
  );
};
export default memo(ListGroup);
