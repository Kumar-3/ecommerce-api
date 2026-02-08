const { User } = require("../models/user");
const { Product } = require("../models/product");
const { default: mongoose } = require("mongoose");

exports.getUsersWishList = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const wishListResponse = [];

    for (const item of user.wishlist) {
      const product = await Product.findById(item.productId);

      if (!product) {
        wishListResponse.push({
          ...item.toObject(),
          productExists: false,
          productOutOfStock: false,
        });
      } else {
        wishListResponse.push({
          productId: product._id,
          productName: product.name,
          productImage: product.image,
          productPrice: product.price,
          productExists: true,
          productOutOfStock: product.countInStock < 1,
        });
      }
    }

    return res.json(wishListResponse);
  } catch (e) {
    console.error("Get User Wishlist Error:", e);
    return res.status(500).json({ message: e.message });
  }
};
exports.addToWishList = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const alreadyExists = user.wishlist.some((item) =>
      item.productId.equals(req.body.productId),
    );

    if (alreadyExists) {
      return res
        .status(409)
        .json({ message: "Product already exists in wishlist" });
    }

    user.wishlist.push({
      productId: product._id,
      productName: product.name,
      productImage: product.image,
      productPrice: product.price,
    });

    await user.save();
    return res.status(200).json({ message: "Added to wishlist" });
  } catch (e) {
    console.error("Add To Wishlist Error:", e);
    return res.status(500).json({ message: e.message });
  }
};
exports.removeFromWishList = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const index = user.wishlist.findIndex((item) =>
      item.productId.equals(req.params.productId),
    );

    if (index === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in wishlist." });
    }

    user.wishlist.splice(index, 1);
    await user.save();

    return res.status(204).end();
  } catch (e) {
    console.error("Remove From Wishlist Error:", e);
    return res.status(500).json({ message: e.message });
  }
};
