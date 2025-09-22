"use client";

import { motion } from "framer-motion";
import Button from "./Button";
import { GeocodeResult } from "@/utils";

// Define the structure of a single geocoding result

interface VerificationModalProps {
  results: GeocodeResult[];
  continent: string;
  onClose: () => void;
  onSelect: (result: GeocodeResult) => void;
}

export default function VerificationModal({
  results,
  continent,
  onClose,
  onSelect,
}: VerificationModalProps) {
  const filteredResults = results.filter(
    (result) =>
      result.components.continent?.toLowerCase() === continent.toLowerCase()
  );
  //   console.log("continent:", continent);
  //   console.log("all the results:", results);
  //   console.log("filtered results:", filteredResults);
  return (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          Verify City
        </h2>
        <p className="text-slate-400 text-center mb-6">
          Please select the correct location from the list below.
        </p>

        <div className="space-y-3">
          {filteredResults.length > 0 ? (
            filteredResults.map((result, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="w-full text-left p-3 bg-slate-700 hover:bg-sky-600 rounded-lg transition-colors duration-200"
                onClick={() => onSelect(result)}
              >
                {result.formatted}
              </motion.button>
            ))
          ) : (
            <p className="text-center text-slate-400">No results found.</p>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button onClick={onClose} className="bg-slate-600 hover:bg-slate-500">
            Cancel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
