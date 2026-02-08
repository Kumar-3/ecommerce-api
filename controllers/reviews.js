const mongoose = require("mongoose");
const { Review } = require("../models/review");
const { User } = require("../models/user");
const { Product } = require("../models/product");

// ✅ Leave Review
exports.leaveReview = async (req, res) => {
  try {
    const user = await User.findById(req.body.user);
    if (!user) {
      return res.status(404).json({ message: "Invalid User!" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    const review = await new Review({
      user: req.body.user,
      userName: user.name,
      rating: req.body.rating,
      comment: req.body.comment,
    }).save();

    if (!review) {
      return res.status(500).json({ message: "The review could not be added" });
    }

    product.reviews.push(review._id);
    await product.save();

    return res.status(201).json({ product, review });
  } catch (e) {
    console.error(`Leave Review error: ${e}`);
    return res.status(500).json({ message: e.message });
  }
};

// ✅ Get Product Reviews
exports.getProductReviews = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(req.params.id).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Product not found" });
    }

    const page = Number(req.query.page) || 1;
    const pageSize = 10;

    const reviews = await Review.find({
      _id: { $in: product.reviews },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .session(session);

    const processedReviews = [];

    for (const review of reviews) {
      const user = await User.findById(review.user).session(session);

      if (!user) {
        processedReviews.push(review);
        continue;
      }

      if (review.userName !== user.name) {
        review.userName = user.name;
        await review.save({ session });
      }

      processedReviews.push(review);
    }

    await session.commitTransaction();

    return res.status(200).json({
      reviews: processedReviews,
      page,
      pageSize,
      totalReviews: product.reviews.length,
    });
  } catch (e) {
    console.error(`Get Product Reviews error: ${e}`);
    await session.abortTransaction();
    return res.status(500).json({ message: e.message });
  } finally {
    session.endSession();
  }
};
