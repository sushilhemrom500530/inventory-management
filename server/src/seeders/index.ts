import mongoose from "mongoose";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../config";
import { User } from "../models/user/user.model";
import { Category } from "../models/category/category.model";
import { Product } from "../models/product/product.model";
import { Sale } from "../models/sale/sale.model";
import { StockMovement } from "../models/stock-movement/stockMovement.model";
import { users, seedCategories, seedProducts } from "../data";
import "dotenv/config";

const MONGODB_URI = process.env.DATABASE_URL!;

async function seedDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Seed Admin User
    const adminUser = {
      fullName: "Admin User",
      email: ADMIN_EMAIL || "admin@example.com",
      password: ADMIN_PASSWORD || "Admin@123",
      role: "admin" as const,
      phone: "01767122497",
      dateOfBirth: "2000-01-01",
      status: "active" as const,
    };

    let admin = await User.findOne({ email: adminUser.email });
    if (!admin) {
      admin = await User.create(adminUser);
      console.log("✅ Admin created");
    } else {
      admin.status = "active";
      await admin.save();
      console.log("ℹ️ Admin already exists");
    }

    // 2. Seed Managers & Employees
    for (const u of users) {
      const exists = await User.exists({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`✅ Created ${u.role}: ${u.email}`);
      }
    }

    // 3. Seed Categories
    const categoryMap = new Map();
    for (const cat of seedCategories) {
      let existingCat = await Category.findOne({ slug: cat.slug });
      if (!existingCat) {
        existingCat = await Category.create(cat);
        console.log(`✅ Created category: ${cat.name}`);
      }
      categoryMap.set(cat.slug, existingCat._id);
    }

    // 4. Seed Products
    const createdProducts: any[] = [];
    for (const prod of seedProducts) {
      const categoryId = categoryMap.get(prod.categorySlug);
      let existingProduct = await Product.findOne({ sku: prod.sku });

      if (!existingProduct && categoryId) {
        existingProduct = await Product.create({
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          category: categoryId,
          description: prod.description,
          costPrice: prod.costPrice,
          sellingPrice: prod.sellingPrice,
          quantity: prod.quantity,
          lowStockThreshold: prod.lowStockThreshold,
          unit: prod.unit,
          status: prod.status,
          images: [],
          isDeleted: false,
        });

        // Initial stock movement
        await StockMovement.create({
          product: existingProduct._id,
          type: "IN",
          quantity: prod.quantity,
          previousStock: 0,
          newStock: prod.quantity,
          reason: "Seed initialization",
          performedBy: admin._id,
        });

        console.log(`✅ Created product: ${prod.name} [${prod.sku}]`);
      }
      if (existingProduct) {
        createdProducts.push(existingProduct);
      }
    }

    // 5. Seed Historical Sales (if no sales exist yet)
    const existingSalesCount = await Sale.countDocuments();
    if (existingSalesCount === 0 && createdProducts.length > 0) {
      console.log("📦 Generating realistic 30-day historical sales data...");
      const dummySales = [];

      for (let day = 28; day >= 1; day--) {
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - day);
        saleDate.setHours(10 + (day % 8), (day * 7) % 60, 0, 0);

        // Pick 1-3 random products to sell on this day
        const selectedProd = createdProducts[day % createdProducts.length];
        const qty = (day % 4) + 1;
        const lineTotal = selectedProd.sellingPrice * qty;

        dummySales.push({
          invoiceNumber: `INV-${saleDate.toISOString().slice(0, 10).replace(/-/g, "")}-00${day}`,
          items: [
            {
              product: selectedProd._id,
              productName: selectedProd.name,
              sku: selectedProd.sku,
              unitPrice: selectedProd.sellingPrice,
              costPrice: selectedProd.costPrice,
              quantity: qty,
              subtotal: lineTotal,
            },
          ],
          subtotal: lineTotal,
          taxRate: 5,
          taxAmount: Math.round(lineTotal * 0.05 * 100) / 100,
          discount: 0,
          grandTotal: Math.round(lineTotal * 1.05 * 100) / 100,
          paymentMethod: day % 2 === 0 ? "card" : "cash",
          cashier: admin._id,
          customerName: `Customer #${100 + day}`,
          status: "completed",
          createdAt: saleDate,
          updatedAt: saleDate,
        });
      }

      await Sale.insertMany(dummySales);
      console.log(`✅ Seeded ${dummySales.length} historical sales records!`);
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  }
}

seedDatabase();
