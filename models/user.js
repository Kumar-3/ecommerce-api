const { Schema, model } = require("mongoose");
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: "Please enter a valid email",
    },
  },
  passwordHash: {
    type: String,
    required: true,
  },
  paymentCustomerId: String,
  street: String,
  apartment: String,
  city: String,
  postalCode: String,
  country: String,
  phone: {
    type: String,
    validate: {
      validator: function (v) {
        return /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: "Please enter a valid phone number",
    },
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },

  resetpasswordOtp: Number,
  resetpasswordOtpExpiry: Date,
  cart: [{ type: Schema.Types.ObjectId, ref: "CartProduct" }],
  wishlist: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: {
        type: String,
        required: true,
      },
      productImage: {
        type: String,
        required: true,
      },
      productPrice: {
        type: Number,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index(
  {
    email: 1,
  },
  { unique: true },
);

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

exports.User = model("User", userSchema);
