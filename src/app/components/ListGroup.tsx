// src/app/components/ListGroup.tsx
"use client";

import React, { memo } from "react";
import { ICity } from "@/models/City";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LoadingSpinner from "./LoadingSpinner"; // The import is now correct and in use

export interface ListGroupProps {
  cities: ICity[];
  onCityDelete: () => void;
  onCitySelect: (id: string) => void;
  selectedID: string | null;
}

// A small component for the status badge
const StatusBadge = ({ status }: { status: string | undefined }) => {
  if (!status || status === "ready") return null;

  const baseClasses = "text-xs font-bold px-2 py-1 rounded-full ml-2";
  let specificClasses = "";

  switch (status) {
    case "pending":
      specificClasses = "bg-yellow-500/20 text-yellow-300 animate-pulse";
      break;
    case "error":
      specificClasses = "bg-red-500/20 text-red-300";
      break;
    default:
      return null;
  }

  return (
    <span className={`${baseClasses} ${specificClasses}`}>
      {status.toUpperCase()}
    </span>
  );
};

const ListGroup = ({
  cities,
  selectedID,
  onCitySelect,
  onCityDelete,
}: ListGroupProps) => {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4 text-center">
        Your Monitored Cities
      </h2>
      <ul className="bg-slate-800 rounded-lg shadow-lg p-0 overflow-hidden">
        {cities.map((item: ICity, index: number) => {
          const isSelected = item._id === selectedID;
          return (
            <React.Fragment key={item._id}>
              <motion.li
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`p-4 cursor-pointer text-center transition-colors duration-200 border-b border-slate-700 last:border-b-0 ${
                  isSelected ? "bg-sky-500 text-white" : "hover:bg-slate-700"
                }`}
                onClick={() => onCitySelect(item._id)}
              >
                {item.name}
                <StatusBadge status={item.status} />
              </motion.li>

              <AnimatePresence>
                {isSelected && (
                  <motion.li
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="bg-sky-900/50 border-b-2 border-sky-600 text-center p-4"
                  >
                    {item.status === "ready" && (
                      <>
                        <p className="text-m text-slate-200 mb-3">
                          Content is ready for {item.name}.
                        </p>
                        <Link
                          href={`/cities/${encodeURIComponent(item.name)}`}
                          className="inline-block bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
                        >
                          Explore {item.name}
                        </Link>
                      </>
                    )}
                    {item.status === "pending" && (
                      <div className="flex items-center justify-center text-slate-300">
                        <LoadingSpinner />
                        <span className="ml-3">Generating content...</span>
                      </div>
                    )}
                    {item.status === "error" && (
                      <p className="text-red-400">
                        Failed to generate content. Please try removing and
                        adding the city again.
                      </p>
                    )}
                  </motion.li>
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
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
