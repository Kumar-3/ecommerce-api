const { Schema, model } = require("mongoose");
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true, trim: true },
  productImage: { type: String, required: true },
  productPrice: { type: Number, required: true, min: 0 },
  selectedSize: { type: String, trim: true },
  selectedColor: { type: String, trim: true },
  quantity: { type: Number, default: 1, min: 1 },
});

orderItemSchema.set("toObject", { virtuals: true });
orderItemSchema.set("toJSON", { virtuals: true });

exports.OrderItem = model("OrderItem", orderItemSchema);
