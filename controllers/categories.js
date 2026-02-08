const { Category } = require("../models/category");

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();

    if (categories.length === 0) {
      return res.status(404).json({
        message: "Categories not found",
      });
    }

    return res.status(200).json(categories);
  } catch (e) {
    console.error(`Get All category error: ${e}`);
    return res.status(500).json({
      message: e.message,
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    return res.status(200).json(category);
  } catch (e) {
    console.error(`Get Category By Id error: ${e}`);
    return res.status(500).json({
      message: e.message,
    });
  }
};
