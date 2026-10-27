import { Notification } from "./notification.model";
import { INotification } from "./notification.interface";
import QueryBuilder from "../../shared/queryBuilder";
import { Types } from "mongoose";

const getAllNotifaction = async (userId: string, query: any) => {
  const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
  const filter: any = {
    ...query,
    $or: [
      ...(userObjectId ? [{ receiver: userObjectId }] : []),
      { receiver: null },
      { receiver: { $exists: false } },
    ],
  };

  const notificationQuery = new QueryBuilder<INotification>(
    Notification.find(),
    filter,
  )
    .search(["fullName", "title", "sender.fullName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const results = await notificationQuery.modelQuery
    .select("-isDeleted -__v")
    .sort({ createdAt: -1 })
    .lean();

  const meta = await notificationQuery.countTotal();

  return {
    meta,
    results,
  };
};

const markAsRead = async (id?: string, userId?: string) => {
  if (!id || id === "all") {
    const userObjectId = userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;
    const filter: any = {
      $or: [
        ...(userObjectId ? [{ receiver: userObjectId }] : []),
        { receiver: null },
        { receiver: { $exists: false } },
      ],
    };
    return await Notification.updateMany(filter, { isRead: true });
  }

  const readNotification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true },
  );
  return readNotification;
};

export const NotificationService = {
  getAllNotifaction,
  markAsRead,
};
