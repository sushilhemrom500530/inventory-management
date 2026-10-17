import mongoose from "mongoose";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../config";
import { User } from "../models/user/user.model";
import { users } from "../data";

const MONGODB_URI = process.env.DATABASE_URL!;

async function seedDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const adminUser = {
      fullName: "Admin User",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin" as const,
      phone: "01767122497",
      dateOfBirth: "2000-01-01",
      status: "active" as const,
    };

    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (!existingAdmin) {
      await User.create(adminUser);
      console.log("✅ Admin created");
    } else {
      existingAdmin.status = "active";
      await existingAdmin.save();
      console.log("ℹ️ Admin already exists");
    }

    for (const user of users) {
      const exists = await User.exists({ email: user.email });

      if (!exists) {
        await User.create(user);
        console.log(`✅ Created ${user.role}: ${user.email}`);
      }
    }

    console.log("🎉 Database seeding completed!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  }
}

seedDatabase();
