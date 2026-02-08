const { Schema, model } = require("mongoose");

const cartProductSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    selectedSize: {
      type: String,
      trim: true,
    },

    selectedColor: {
      type: String,
      trim: true,
    },

    // Snapshot fields (intentional)
    productName: {
      type: String,
      required: true,
      trim: true,
    },

    productImage: {
      type: String,
      required: true,
    },

    productPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Reservation system
    reserved: {
      type: Boolean,
      default: true,
    },

    reservationExpiry: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true },
);

cartProductSchema.set("toObject", { virtuals: true });
cartProductSchema.set("toJSON", { virtuals: true });

exports.CartProduct = model("CartProduct", cartProductSchema);
