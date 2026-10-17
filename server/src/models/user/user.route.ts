import express from "express";
import { UserController } from "./user.controller";
import { auth } from "./../../middlewares/auth";
import validateRequest from "./../../shared/validateRequest";
import { userValidation } from "./user.validation";
import {
  cacheMiddleware,
  clearCacheMiddleware,
} from "./../../middlewares/cacheMiddleware";
import { multiUploadHandler } from "../../handler/cloudinary/fileUploadHandler";

const router = express.Router();

router.get(
  "/get-all",
  auth("common"),
  cacheMiddleware("users", 60),
  UserController.getAll,
);

router.get(
  "/find/:id",
  auth("common"),
  cacheMiddleware("users", 60),
  UserController.getSingleUser,
);

router.patch(
  "/update-my-profile",
  auth("common"),
  clearCacheMiddleware("users"),
  multiUploadHandler([{ name: "profile", maxCount: 1 }]),
  UserController.updateMyProfile,
);

router.get(
  "/get-my-profile",
  auth("common"),
  cacheMiddleware("users", 60),
  UserController.getMyProfile,
);

router.patch(
  "/delete/my-account",
  auth("common"),
  clearCacheMiddleware("users"),
  UserController.softDeleteUser,
);

router.delete(
  "/delete/:id",
  auth("admin"),
  clearCacheMiddleware("users"),
  UserController.deleteUser,
);

router.patch(
  "/change-status/:id",
  auth("admin"),
  clearCacheMiddleware("users"),
  validateRequest(userValidation.changeUserStatus),
  UserController.changeUserStatus,
);

export const UserRoutes = router;
