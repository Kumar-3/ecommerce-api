const express = require("express");
const router = express.Router();

const usersController = require("../controllers/user");
const wishListController = require("../controllers/wishlist");
const cartController = require("../controllers/cart");

// Users
router.get("/", usersController.getUsers);
router.get("/:id", usersController.getUserById);
router.put("/:id", usersController.updateUser);

// Wishlist
router.get("/:id/wishlist", wishListController.getUsersWishList);
router.post("/:id/wishlist", wishListController.addToWishList);
router.delete(
  "/:id/wishlist/:productId",
  wishListController.removeFromWishList,
);

// Cart
router.get("/:id/cart", cartController.getUserCart);
router.get("/:id/cart/count", cartController.getUserCartCount);
router.get("/:id/cart/:cartProductId", cartController.getCartProductById);
router.post("/:id/cart", cartController.addToCart);
router.put("/:id/cart/:cartProductId", cartController.modifyProductQuantity);
router.delete("/:id/cart/:cartProductId", cartController.removeFromCart);

module.exports = router;
