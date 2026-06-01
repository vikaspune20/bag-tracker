import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bagStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bag-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  } as any,
});

export const bagUpload = multer({
  storage: bagStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
});
