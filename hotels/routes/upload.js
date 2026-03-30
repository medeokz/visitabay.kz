const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Save uploads into shared project-level uploads directory.
// This path is served by the unified app at /uploads.
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().replace(/^\./, '') || 'jpg';
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = /\.(jpe?g|png|gif|webp)$/i.test(file.originalname) || /^image\//.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Только изображения (jpg, png, gif, webp)'));
  },
});

router.post('/', requireAuth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Файл не более 5 МБ' });
      }
      return res.status(400).json({ error: err.message || 'Ошибка загрузки' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Выберите файл изображения' });
    }
    const url = (req.app.locals.basePath || '') + '/uploads/' + req.file.filename;
    res.json({ url });
  });
});

module.exports = router;
