import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadPath = process.env.UPLOAD_PATH || './uploads';

// Garantir que a pasta de uploads existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 16 * 1024 * 1024 // 16MB default
  }
});
