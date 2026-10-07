import mongoose from "mongoose";

const catalogSourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["publisher", "store", "synopsis"],
      required: true,
    },
    license: {
      type: String,
    },
    permission: {
      type: String,
      enum: ["approved", "pending", "revoked"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CatalogSource", catalogSourceSchema);