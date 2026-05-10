import multer from "multer";

// ---------------------------------------------------------------------------
// Memory storage — file lands as req.file.buffer, ready for Drive upload.
// No temp files written to disk.
// ---------------------------------------------------------------------------

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."), false);
  }
};

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});

export default uploadPdf;