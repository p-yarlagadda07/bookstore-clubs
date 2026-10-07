import mongoose from "mongoose";

const pickupWindowSchema = new mongoose.Schema(
  {
    start: Date,
    end: Date,
  },
  {
    _id: true,
  }
);

const inventorySchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    condition: {
      type: String,
      enum: ["new", "used"],
      required: true,
    },
    total: {
      type: Number,
      default: 0,
    },
    available: {
      type: Number,
      default: 0,
    },
    held: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "unavailable"],
      default: "active",
    },
    pickupWindows: [pickupWindowSchema],
  },
  {
    timestamps: true,
  }
);

inventorySchema.index(
  { bookId: 1, condition: 1 },
  { unique: true }
);

export default mongoose.model("Inventory", inventorySchema);