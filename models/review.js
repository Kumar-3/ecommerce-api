const { Schema, model } = require("mongoose");

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userName: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true },
);

reviewSchema.set("toJSON", { virtuals: true });
reviewSchema.set("toObject", { virtuals: true });
exports.Review = model("Review", reviewSchema);
