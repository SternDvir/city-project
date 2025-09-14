import { motion } from "framer-motion";

export default function DeletionToast() {
  return (
    <motion.div
      layout // Ensures smooth resizing if content changes
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="fixed bottom-5 left-5 bg-slate-800 border border-slate-700 text-white p-4 rounded-lg shadow-lg w-64"
    >
      <p className="text-sm font-semibold">City Deleted</p>
      <p className="text-xs text-slate-400 mb-2">
        The item has been removed from the list.
      </p>
      <div className="w-full bg-slate-600 rounded-full h-1.5">
        {/* The loading bar */}
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 3, ease: "linear" }} // Animate over 3 seconds
          className="bg-red-500 h-1.5 rounded-full"
        ></motion.div>
      </div>
    </motion.div>
  );
}
