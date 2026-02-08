const { Product } = require("../../models/product");
const { Review } = require("../../models/review");
const media_helper = require("../../helpers/media_helper");
const util = require("util");
const { Category } = require("../../models/category");
const multer = require("multer");
const { default: mongoose } = require("mongoose");
exports.getProductsCount = async function (req, res) {
  try {
    const count = await Product.countDocuments();

    if (!count) {
      return res.json(404).json({
        message: "Could not count products",
      });
    }
    return res.json({ count });
  } catch (e) {
    console.error(`Get product error ${e}`);
    return res.status(500).json({ type: e.type, message: e.messages });
  }
};
exports.addProduct = async function (req, res) {
  try {
    const uploadImage = util.promisify(
      media_helper.upload.fields([
        { name: "image", maxCount: 1 },
        { name: "images", maxCount: 10 },
      ]),
    );

    // Upload images
    await uploadImage(req, res);

    // Validate category
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(404).json({ message: "Invalid Category" });
    }

    if (category.markedForDeletion) {
      return res.status(400).json({
        message:
          "Category is marked for deletion. You can't add products to this category",
      });
    }

    // Validate main product image
    const mainImage = req.files?.image?.[0];
    if (!mainImage) {
      return res.status(400).json({
        message: "Product image is required",
      });
    }

    // Create main image URL
    req.body.image = `${req.protocol}://${req.get(
      "host",
    )}/${mainImage.path.replace(/\\/g, "/")}`;

    // Handle gallery images
    const galleryImages = req.files?.images || [];
    if (galleryImages.length > 0) {
      req.body.images = galleryImages.map(
        (img) =>
          `${req.protocol}://${req.get("host")}/${img.path.replace(/\\/g, "/")}`,
      );
    }

    // Convert form-data values
    if (req.body.sizes) {
      req.body.sizes = req.body.sizes.split(",");
    }

    req.body.price = Number(req.body.price);
    req.body.countInStock = Number(req.body.countInStock);

    // Create product
    const product = await Product.create(req.body);

    return res.status(201).json(product);
  } catch (e) {
    if (e instanceof multer.MulterError) {
      return res.status(400).json({
        message: e.message,
      });
    }

    console.error("Add product error:", e);
    return res.status(500).json({
      message: e.message,
    });
  }
};
exports.updateProduct = async function (req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Invalid Product" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Invalid Product" });
    }
    if (req.body?.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(404).json({ message: "Invalid Category" });
      }

      if (category.markedForDeletion) {
        return res.status(400).json({
          message:
            "Category marked for deletion, you cannot add products to this category",
        });
      }
    }
    const mainImage = req.files?.image?.[0];
    if (mainImage) {
      req.body.image = `${req.protocol}://${req.get("host")}/${mainImage.path.replace(/\\/g, "/")}`;
    }
    const galleryImages = req.files?.images || [];
    if (galleryImages.length > 0) {
      const totalImages = product.images.length + galleryImages.length;
      if (totalImages > 10) {
        return res.status(400).json({ message: "Image limit exceeded (10)" });
      }

      const newImages = galleryImages.map(
        (img) =>
          `${req.protocol}://${req.get("host")}/${img.path.replace(/\\/g, "/")}`,
      );

      req.body.images = [...product.images, ...newImages]; // ✅ append
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    );

    return res.json(updatedProduct);
  } catch (e) {
    if (e instanceof multer.MulterError) {
      return res.status(400).json({ message: e.message });
    }

    console.error("Update product error:", e);
    return res.status(500).json({ message: e.message });
  }
};

exports.deleteProductImages = async function (req, res) {
  try {
    const productId = req.params.id;
    const { deletedImageUrls } = req.body;
    if (
      !mongoose.isValidObjectId(productId) ||
      !Array.isArray(deletedImageUrls)
    ) {
      return res.status(400).json({
        message: "Invalid request data",
      });
    }

    await media_helper.deleteImages(deletedImageUrls);
    const product = await Product.findById(productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    product.images = product.images.filter(
      (image) => !deletedImageUrls.includes(image),
    );
    await product.save();
    return res.status(204).end();
  } catch (e) {
    console.error(`Delete product error ${e}`);
    if (e.code === "ENOENT") {
      return res.status(404).json({
        message: "Image not found",
      });
    }
    return res.status(500).json({ type: e.type, message: e.messages });
  }
};
exports.deleteProduct = async function (req, res) {
  try {
    const productId = req.params.id;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({
        message: "Invalid Product",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(401).json({ message: "Product not found" });
    }
    await media_helper.deleteImages(
      [...product.images, product.image],
      "ENOENT",
    );
    await Review.deleteMany({
      _id: {
        $in: product.reviews,
      },
    });

    await Product.findByIdAndDelete(productId);
    return res.status(204).end();
  } catch (e) {
    console.error(`Delete product error ${e}`);
    return res.status(500).json({ type: e.type, message: e.messages });
  }
};

exports.getProducts = async function (req, res) {
  try {
    const page = req.query.page || 1;
    const pageSize = 10;
    const products = await Product.find()
      .select("-reviews -ratings")
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    if (!products) {
      return res.status(404).json({
        message: "Prodcuts not found",
      });
    }
    return res.json(products);
  } catch (e) {
    console.error(`Delete product error ${e}`);
    return res.status(500).json({ type: e.type, message: e.messages });
  }
};
