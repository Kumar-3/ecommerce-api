const { Product } = require("../models/product");

exports.getProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = 10;

    let query = {};
    let sortQuery = {};

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.criteria) {
      switch (req.query.criteria) {
        case "newArrivals": {
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          query.dateAdded = { $gte: twoWeeksAgo };
          sortQuery = { dateAdded: -1 };
          break;
        }

        case "popular": {
          query.rating = { $gte: 4.5 };
          sortQuery = { rating: -1 };
          break;
        }

        default:
          break;
      }
    }

    const products = await Product.find(query)
      .select("-images -reviews -sizes")
      .sort(sortQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.status(200).json(products);
  } catch (e) {
    console.error(`Get Products error: ${e}`);
    return res.status(500).json({ message: e.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const searchItem = req.query.q;
    const page = Number(req.query.page) || 1;
    const pageSize = 10;

    let query = {};

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.genderAgeCategory) {
      query.genderAgeCategory = req.query.genderAgeCategory.toLowerCase();
    }

    if (searchItem) {
      query.$text = {
        $search: searchItem,
        $language: "english",
        $caseSensitive: false,
      };
    }

    const searchResults = await Product.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return res.json(searchResults);
  } catch (e) {
    console.error(`Search Products error: ${e}`);
    return res.status(500).json({ message: e.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("-reviews");

    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    return res.status(200).json(product);
  } catch (e) {
    console.error(`Get Product By Id error: ${e}`);
    return res.status(500).json({ message: e.message });
  }
};
