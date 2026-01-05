const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");

// USERS
router.get("/users/count", adminController.getUserCount);
router.delete("/users/:id", adminController.deleteUser);

// CATEGORIES
router.post("/categories", adminController.addCategory);
router.put("/categories/:id", adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

// PRODUCTS
router.get("/products/count", adminController.getProductCount);
router.post("/products", adminController.addProduct);
router.put("/products/:id", adminController.updateProduct);
router.delete("/products/:id/images", adminController.deleteProductImages);
router.delete("/products/:id", adminController.deleteProduct);

// ORDERS
router.get("/orders", adminController.getOrders);
router.get("/orders/count", adminController.getOrderCount);
router.patch("/orders/:id/status", adminController.changeOrderStatus);

module.exports = router;
