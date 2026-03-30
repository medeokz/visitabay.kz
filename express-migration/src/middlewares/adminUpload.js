const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsRoot = path.join(__dirname, "..", "..", "..", "uploads");

function monthFolder() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function safeBaseName(name) {
  return String(name || "")
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9а-яёіїңғүұқөһ_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "image";
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const isVideo = String(file.mimetype || "").startsWith("video/");
    const dir = path.join(uploadsRoot, isVideo ? "files" : "posts", monthFolder());
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeBaseName(file.originalname)}${ext}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  const mt = String(file.mimetype || "");
  const isOk = mt.startsWith("image/") || mt.startsWith("video/");
  if (isOk) return cb(null, true);
  return cb(new Error("Можно загружать только изображения или видео."), false);
}

const upload = multer({
  storage,
  fileFilter,
  // Без лимитов: по запросу разрешаем несколько видео и "без ограничений размера/количества".
  // (Ограничения на практике могут быть в самом reverse proxy / nginx / browser.)
});

// Загрузка медиа для постов.
// Используем upload.any(), чтобы не падать при несовпадении/лишних file-field'ов в форме
// (например, если фронт отправляет поле, которого multer не ожидает).
const uploadPostImages = [
  upload.any(),
  (req, res, next) => {
    const files = Array.isArray(req.files) ? req.files : [];

    const toWebPath = (file) => {
      if (!file || !file.path) return "";
      const rel = path.relative(uploadsRoot, file.path).replace(/\\/g, "/");
      return rel;
    };

    const posterFile = files.find((f) => f && f.fieldname === "poster_upload") || null;
    const galleryFiles = files.filter((f) => f && f.fieldname === "gallery_upload");

    req.uploadedImages = {
      poster: posterFile ? toWebPath(posterFile) : "",
      gallery: galleryFiles.map(toWebPath).filter(Boolean).slice(0, 100)
    };

    // Видео для поля "Полный текст" (вставится в full_story после сохранения).
    // Поддерживаем несколько файлов с одним и тем же fieldname.
    const videoFiles = files.filter((f) => f && f.fieldname === "full_story_video_upload");
    req.uploadedFullStoryVideos = videoFiles.map(toWebPath).filter(Boolean);

    next();
  }
];

const uploadTour3dPoster = [
  upload.fields([{ name: "poster_upload", maxCount: 1 }]),
  (req, res, next) => {
    const f = (req.files && req.files.poster_upload && req.files.poster_upload[0]) || null;
    const toWebPath = (file) => {
      if (!file || !file.path) return "";
      const rel = path.relative(uploadsRoot, file.path).replace(/\\/g, "/");
      return rel;
    };
    req.uploadedTour3dPoster = f ? toWebPath(f) : "";
    next();
  }
];

module.exports = {
  uploadPostImages,
  uploadTour3dPoster
};
