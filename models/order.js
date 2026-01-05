const { Schema, model } = require("mongoose");

const orderSchema = new Schema({
  orderItems: [
    { type: Schema.Types.ObjectId, ref: "OrderItem", required: true },
  ],
  shippingAddress1: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true, match: /^[0-9]{10,15}$/ },
  paymentId: { type: String },
  status: {
    type: String,
    default: "pending",
    enum: [
      "pending",
      "processed",
      "shipped",
      "out-for-delivery",
      "delivered",
      "cancelled",
      "on-hold",
      "expired",
    ],
  },
  statusHistory: [
    {
      status: {
        type: String,
        enum: [
          "pending",
          "processed",
          "shipped",
          "out-for-delivery",
          "delivered",
          "cancelled",
          "on-hold",
          "expired",
        ],
        required: true,
      },
      date: { type: Date, default: Date.now },
    },
  ],
  totalPrice: { type: Number, required: true, min: 0 },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dateOrdered: { type: Date, default: Date.now },
});

orderSchema.set("toObject", { virtuals: true });
orderSchema.set("toJSON", { virtuals: true });

exports.Order = model("Order", orderSchema);
