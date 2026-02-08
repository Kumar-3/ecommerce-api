const media_helper = require("../../helpers/media_helper");
const util = require("util");
const { Category } = require("../../models/category");

exports.getCategories = async function (req, res) {
  try {
    const categories = await Category.find({
      markedForDeletion: { $ne: true },
    }).select(["-__v"]);
    if (!categories) {
      return res.status(404).json({ message: "No categories found" });
    }
    return res.json(categories);
  } catch (e) {
    console.error(`Get Categories error ${e}`);
    return res.status(500).json({ type: e.type, message: e.messages });
  }
};

exports.addCategory = async function (req, res) {
  try {
    const uploadImage = util.promisify(
      media_helper.upload.fields([{ name: "image", maxCount: 1 }]),
    );

    await uploadImage(req, res);

    const image = req.files?.image?.[0];

    if (!image) {
      return res.status(400).json({
        message: "Category image is required",
      });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/${image.path.replace(
      /\\/g,
      "/",
    )}`;
    req.body.image = imageUrl;

    let category = new Category(req.body);
    category = await category.save();

    if (!category) {
      return res.status(500).json({
        message: "The category could not be created.",
      });
    }

    return res.status(201).json({
      message: "Category added successfully",
      category,
    });
  } catch (error) {
    console.error(`Add category error: ${error.message}`);

    return res.status(500).json({
      message: error.message,
      field: error.field || null,
      storageError: error.storageError || null,
    });
  }
};

exports.updateCategory = async function (req, res) {
  try {
    // upload image if exists
    const upload = util.promisify(
      media_helper.upload.fields([{ name: "image", maxCount: 1 }]),
    );

    await upload(req, res);

    const updateData = {};
    const { name, color } = req.body;

    if (name) updateData.name = name;
    if (color) updateData.color = color;

    // if image uploaded
    if (req.files?.image?.[0]) {
      const image = req.files.image[0];
      updateData.image = `${req.protocol}://${req.get(
        "host",
      )}/${image.path.replace(/\\/g, "/")}`;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error(`Update Category error: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async function (req, res) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    category.markedForDeletion = true;
    await category.save();
    return res.status(200).json({ message: "Category marked for deletion" });
  } catch (e) {
    console.error(`Delete category error ${e}`);
    return res.status(500).json({ type: e.type, message: e.messages });
  }
};
