import mongoose, { Schema, Document } from "mongoose";

// 1. Define the interface for our City document
export interface ICity extends Document {
  _id: string; // The unique identifier, now coming from OpenCage (geohash)
  name: string;
  continent: string;
}

// 2. Create the Mongoose Schema
const CitySchema: Schema = new Schema({
  _id: {
    type: String,
    required: [true, "Please provide a unique ID for the city."],
  },
  name: {
    type: String,
    required: [true, "Please provide a name for the city."],
    trim: true, // Removes whitespace from both ends
  },
  continent: {
    type: String,
    required: [true, "Please provide the continent for the city."],
    trim: true,
  },
});

// 3. Create and export the Mongoose Model
// This line is crucial for Next.js. It checks if the model already exists
// before trying to create it, preventing errors during hot-reloading.
export default mongoose.models.City ||
  mongoose.model<ICity>("City", CitySchema);
