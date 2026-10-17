import { Category } from "./category.model";
import { ICategory } from "./category.interface";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../shared/queryBuilder";
import { Product } from "../product/product.model";

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const createCategory = async (payload: Partial<ICategory>): Promise<ICategory> => {
  const slug = generateSlug(payload.name!);
  const existing = await Category.findOne({ $or: [{ name: payload.name }, { slug }] });

  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, "Category with this name already exists");
  }

  const category = await Category.create({
    ...payload,
    slug,
  });

  return category;
};

const getAllCategories = async (query: Record<string, unknown>) => {
  const categoryQuery = new QueryBuilder(Category.find(), query)
    .search(["name", "description"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const categories = await categoryQuery.modelQuery.lean();
  const meta = await categoryQuery.countTotal();

  // Attach product counts dynamically
  const categoryIds = categories.map((c: any) => c._id);
  const counts = await Product.aggregate([
    { $match: { category: { $in: categoryIds }, isDeleted: false } },
    { $group: { _id: "$category", count: { $sum: 1 }, totalStock: { $sum: "$quantity" } } },
  ]);

  const countMap = new Map(counts.map((item) => [String(item._id), item]));

  const enrichedCategories = categories.map((cat: any) => {
    const item = countMap.get(String(cat._id));
    return {
      ...cat,
      productCount: item?.count || 0,
      totalStock: item?.totalStock || 0,
    };
  });

  return {
    meta,
    data: enrichedCategories,
  };
};

const getCategoryById = async (id: string): Promise<ICategory | null> => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }
  return category;
};

const updateCategory = async (
  id: string,
  payload: Partial<ICategory>,
): Promise<ICategory | null> => {
  if (payload.name) {
    payload.slug = generateSlug(payload.name);
    const existing = await Category.findOne({
      _id: { $ne: id },
      $or: [{ name: payload.name }, { slug: payload.slug }],
    });
    if (existing) {
      throw new AppError(StatusCodes.CONFLICT, "Another category with this name already exists");
    }
  }

  const updatedCategory = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedCategory) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  return updatedCategory;
};

const deleteCategory = async (id: string): Promise<ICategory | null> => {
  // Safeguard: Check if any active products belong to this category
  const productCount = await Product.countDocuments({ category: id, isDeleted: false });
  if (productCount > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Cannot delete category: ${productCount} active product(s) are still assigned to it. Reassign them first.`,
    );
  }

  const deletedCategory = await Category.findByIdAndDelete(id);
  if (!deletedCategory) {
    throw new AppError(StatusCodes.NOT_FOUND, "Category not found");
  }

  return deletedCategory;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
