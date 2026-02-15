const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orders");

router.get("/users/:userId", orderController.getUserOrders);
router.get("/:orderId", orderController.getOrderById);

module.exports = router;
