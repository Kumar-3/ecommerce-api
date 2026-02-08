const { Schema, model } = require("mongoose");

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  color: { type: String, required: true },
  image: { type: String, required: true },
  images: [{ type: String }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  numberOfReviews: { type: Number, default: 0 },
  sizes: [{ type: String }],
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  genderCategory: {
    type: String,
    enum: ["men", "women", "unisex", "kids"],
    required: true,
  },
  countInStock: { type: Number, required: true, min: 0, max: 225 },
  dateAdded: { type: Date, default: Date.now },
});

//pre-save hook
productSchema.pre("save", async function () {
  if (this.reviews.length > 0) {
    await this.populate("reviews");

    const totalRating = this.reviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );

    this.numberOfReviews = this.reviews.length;
    this.rating = parseFloat((totalRating / this.reviews.length).toFixed(1));
  }
});

productSchema.index({ name: "text", description: "text" });

productSchema.set("toObject", { virtuals: true });
productSchema.set("toJSON", { virtuals: true });

exports.Product = model("Product", productSchema);
