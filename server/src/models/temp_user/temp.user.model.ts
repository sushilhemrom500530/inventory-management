import { model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import { IUser } from "./../user/user.interface";

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
    },
    dateOfBirth: {
      type: String,
    },
    phone: {
      type: String,
    },
    profileUrl: {
      type: String,
      default:
        "https://iter-bene.s3.eu-north-1.amazonaws.com/15206766-215b-415e-8016-dd1bd32c4ad6.png",
    },
    coverImage: {
      type: Object,
    },

    fcmToken: {
      type: String,
      required: false,
    },
    provider: {
      type: String,
      enum: ["google", "apple"],
    },
    providerId: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended", "deleted"],
      default: "pending",
    },
  },
  { timestamps: true },
);
// Pre-save hook for hashing password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// user model
export const TempUser = model<IUser>("TempUser", userSchema);
