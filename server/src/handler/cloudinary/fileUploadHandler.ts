import multer, { FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import {
  CLOUDINARY_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "../../config";

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const allowedTypes: string[] = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("File type not allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

const uploadToCloudinary = async (
  file: Express.Multer.File,
): Promise<string> => {
  const base64 = file.buffer.toString("base64");

  const result = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${base64}`,
    {
      public_id: uuidv4(),
      resource_type: "auto",
    },
  );

  return result.secure_url;
};

export const singleUploadHandler = (fieldName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, async (err: unknown) => {
      if (err) return next(err);

      if (!req.file) return next();

      try {
        const url = await uploadToCloudinary(req.file);

        (req.body as any).files = {
          [fieldName]: url,
        };

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};

export const multiUploadHandler = (
  fields: { name: string; maxCount?: number }[],
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    upload.fields(fields)(req, res, async (err: unknown) => {
      if (err) return next(err);

      if (!req.files) return next();

      const files = req.files as Record<string, Express.Multer.File[]>;
      const uploadedUrls: Record<string, string | string[]> = {};

      try {
        for (const fieldName of Object.keys(files)) {
          const fileArray = files[fieldName];

          const urls = await Promise.all(
            fileArray.map((file) => uploadToCloudinary(file)),
          );

          uploadedUrls[fieldName] = urls.length === 1 ? urls[0] : urls;
        }

        // attach all uploaded files
        (req.body as any).files = uploadedUrls;

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};
