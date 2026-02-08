const { User } = require("../models/user");
const { CartProduct } = require("../models/cart_product");
const { Product } = require("../models/product");
const { default: mongoose } = require("mongoose");
exports.getUserCart = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartProducts = await CartProduct.find({
      _id: { $in: user.cart },
    });

    const cart = [];

    for (const cartProduct of cartProducts) {
      const product = await Product.findById(cartProduct.product);

      if (!product) {
        cart.push({
          ...cartProduct.toObject(),
          productExists: false,
          productOutOfStock: false,
        });
      } else {
        cart.push({
          ...cartProduct.toObject(),
          name: product.name,
          productImage: product.image,
          productPrice: product.price,
          productExists: true,
          productOutOfStock: product.countInStock < cartProduct.quantity,
        });
      }
    }

    return res.status(200).json(cart);
  } catch (e) {
    console.error("Get User Cart Error:", e);
    return res.status(500).json({ message: e.message });
  }
};
exports.getUserCartCount = async function (req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      count: user.cart.length,
    });
  } catch (e) {
    console.error("Get User Cart Count Error:", e);
    return res.status(500).json({ message: e.message });
  }
};
exports.getCartProductById = async function (req, res) {
  try {
    const cartProduct = await CartProduct.findById(req.params.cartProductId);
    if (!cartProduct) {
      return res.status(404).json({ message: "Cart product not found!" });
    }

    const product = await Product.findById(cartProduct.product);

    if (!product) {
      return res.status(200).json({
        ...cartProduct.toObject(),
        productExists: false,
        productOutOfStock: false,
      });
    }

    return res.status(200).json({
      ...cartProduct.toObject(),
      name: product.name,
      productImage: product.image,
      productPrice: product.price,
      productExists: true,
      productOutOfStock: product.countInStock < cartProduct.quantity,
    });
  } catch (e) {
    console.error("Get Cart Product Error:", e);
    return res.status(500).json({ message: e.message });
  }
};
exports.addToCart = async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, selectedSize, selectedColor } = req.body;

    const user = await User.findById(req.params.id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Product not found" });
    }

    const userCartProducts = await CartProduct.find({
      _id: { $in: user.cart },
    }).session(session);

    const existingCartItem = userCartProducts.find(
      (item) =>
        item.product.equals(product._id) &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor,
    );

    // CASE 1: Item already exists → increase quantity
    if (existingCartItem) {
      if (product.countInStock < existingCartItem.quantity + 1) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Out of stock" });
      }

      existingCartItem.quantity += 1;
      await existingCartItem.save({ session });

      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { countInStock: -1 } },
        { session },
      );

      await session.commitTransaction();

      return res.status(200).json({
        message: "Cart updated",
        cartProduct: existingCartItem,
      });
    }

    // CASE 2: New cart item
    if (product.countInStock < 1) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Out of stock" });
    }
    const newCartProduct = await CartProduct.create(
      [
        {
          product: product._id,
          quantity: 1,
          selectedSize,
          selectedColor,
          productName: product.name,
          productImage: product.image,
          productPrice: product.price,
        },
      ],
      { session },
    );

    user.cart.push(newCartProduct[0]._id);
    await user.save({ session });

    await Product.findByIdAndUpdate(
      product._id,
      { $inc: { countInStock: -1 } },
      { session },
    );

    await session.commitTransaction();

    return res.status(201).json({
      message: "Added to cart",
      cartProduct: newCartProduct[0],
    });
  } catch (e) {
    await session.abortTransaction();
    console.error("Add to Cart Error:", e);
    return res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
};
exports.modifyProductQuantity = async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const user = await User.findById(req.params.id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure cart item belongs to user
    if (!user.cart.includes(req.params.cartProductId)) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Unauthorized cart access" });
    }

    const cartProduct = await CartProduct.findById(
      req.params.cartProductId,
    ).session(session);

    if (!cartProduct) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Cart product not found" });
    }

    const product = await Product.findById(cartProduct.product).session(
      session,
    );
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Product does not exist" });
    }

    const difference = quantity - cartProduct.quantity;

    // If increasing quantity → check & reduce stock
    if (difference > 0) {
      if (product.countInStock < difference) {
        await session.abortTransaction();
        return res.status(400).json({
          message: "Insufficient stock for the requested quantity",
        });
      }

      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { countInStock: -difference } },
        { session },
      );
    }

    // If decreasing quantity → release stock
    if (difference < 0) {
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { countInStock: Math.abs(difference) } },
        { session },
      );
    }

    cartProduct.quantity = quantity;
    await cartProduct.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      message: "Cart quantity updated",
      cartProduct: cartProduct.toObject(),
    });
  } catch (e) {
    await session.abortTransaction();
    console.error("Update Cart Quantity Error:", e);
    return res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
};
exports.removeFromCart = async function (req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.params.id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    // Security: ensure cart item belongs to user
    if (!user.cart.includes(req.params.cartProductId)) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Product not in your cart" });
    }

    const cartItemToRemove = await CartProduct.findById(
      req.params.cartProductId,
    ).session(session);

    if (!cartItemToRemove) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Restore stock if item was reserved
    if (cartItemToRemove.reserved) {
      const updatedProduct = await Product.findByIdAndUpdate(
        cartItemToRemove.product,
        { $inc: { countInStock: cartItemToRemove.quantity } },
        { session, new: true },
      );

      if (!updatedProduct) {
        await session.abortTransaction();
        return res.status(500).json({ message: "Failed to restore stock" });
      }
    }

    // Remove cart reference from user
    user.cart.pull(cartItemToRemove._id);
    await user.save({ session });

    // Delete cart item
    await CartProduct.findByIdAndDelete(cartItemToRemove._id).session(session);

    await session.commitTransaction();

    return res.status(204).end();
  } catch (e) {
    await session.abortTransaction();
    console.error("Remove Product from Cart Error:", e);
    return res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
};
