import { Document } from "mongoose";
import { Types } from "mongoose";

export type UserRole = "admin" | "manager" | "employee";

type ProviderType = "google" | "apple";

type UserStatus = "pending" | "active" | "inactive" | "suspended" | "deleted";

export interface IUser {
  _id?: Types.ObjectId;

  fullName: string;

  email: string;

  password: string;

  role?: UserRole;

  dateOfBirth: string;

  phone: string;

  profileUrl?: string;

  coverImage?: Record<string, any>;

  gender?: string;

  fcmToken?: string;

  provider?: ProviderType;

  providerId?: string;

  isDeleted?: boolean;

  status?: UserStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOTP extends Document {
  email: string;
  otp: string;
  verified: boolean;
  expiresAt: Date;
}
