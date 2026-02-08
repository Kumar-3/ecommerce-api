const cron = require("node-cron");
const { Category } = require("../models/category");
const { Product } = require("../models/product");
const { CartProduct } = require("../models/cart_product");
const { default: mongoose } = require("mongoose");
cron.schedule("0 0 * * *", async function () {
  try {
    const categoryToBeDeleted = await Category.find({
      markedForDeletion: true,
    });
    for (const category of categoryToBeDeleted) {
      const categoryProductsCount = await Product.countDocuments({
        category: category.id,
      });
      if (categoryProductsCount < 1) await category.deleteOne();
    }
    console.log(`CRON job completd at `, new Date());
  } catch (e) {
    console.error("CRON job error", error);
  }
});

cron.schedule("*/30 * * * *", async function () {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Reservation Release CRON started at", new Date());

    const expiredReservations = await CartProduct.find({
      reserved: true,
      reservationExpiry: { $lte: new Date() },
    }).session(session);

    for (const cartProduct of expiredReservations) {
      // Restore stock
      const product = await Product.findByIdAndUpdate(
        cartProduct.product,
        { $inc: { countInStock: cartProduct.quantity } },
        { session, new: true },
      );

      if (!product) {
        throw new Error("Product not found while restoring stock");
      }

      // Remove cart item from user
      await User.updateOne(
        { cart: cartProduct._id },
        { $pull: { cart: cartProduct._id } },
        { session },
      );

      // Delete cart product
      await CartProduct.findByIdAndDelete(cartProduct._id).session(session);
    }

    await session.commitTransaction();
    console.log("Reservation Release CRON completed at", new Date());
  } catch (error) {
    await session.abortTransaction();
    console.error("Reservation Release CRON error:", error);
  } finally {
    session.endSession();
  }
});
