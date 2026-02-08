const { unlink } = require("fs/promises");
const multer = require("multer");
const path = require("path");

const ALLOWED_EXTENSION = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const ext = ALLOWED_EXTENSION[file.mimetype];
    const baseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/\s+/g, "-");

    cb(null, `${baseName}-${Date.now()}.${ext}`);
  },
});

exports.upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter(req, file, cb) {
    const isValid = ALLOWED_EXTENSION[file.mimetype];
    if (!isValid) {
      return cb(new Error(`Invalid image type: ${file.mimetype}`), false);
    }
    cb(null, true);
  },
});

exports.deleteImages = async function (imageUrls, continueOnErrorName) {
  await Promise.all(
    imageUrls.map(async (imageUrl) => {
      const imagePath = path.resolve(
        __dirname,
        "..",
        "public",
        "uploads",
        path.basename(imageUrl)
      );
      try {
        await unlink(imagePath);
      } catch (error) {
        if (error === continueOnErrorName) {
          console.error(`Continuing with the next image: ${error.message}`);
        } else {
          console.error(`Error deleting images:   ${error.message}`);
          throw error;
        }
      }
    })
  );
};
