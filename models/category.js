const { Schema, model } = require("mongoose");
const categorySchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  color: { type: String, default: "#000000", match: /^#([0-9A-F]{3}){1,2}$/i },
  image: { type: String, required: true },
  markedForDeletion: { type: Boolean, default: false },
});

categorySchema.set("toObject", { virtuals: true });
categorySchema.set("toJSON", { virtuals: true });

exports.Category = model("Category", categorySchema);
