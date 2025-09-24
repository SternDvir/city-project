import { Mongoose } from "mongoose";

declare global {
  /* eslint-disable no-var */
  var mongoose: {
    promise: Promise<Mongoose> | null;
    conn: Mongoose | null;
  };
}
