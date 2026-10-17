import { INotificationProvider, NotificationPayload } from "../types";
import { logger } from "../../logger/logger";
import { transporter } from "../../utils/nodemailer";

export class EmailProvider implements INotificationProvider {
  async send(payload: NotificationPayload): Promise<void> {
    try {
      const recipientEmail = payload.data?.email;

      if (!recipientEmail) {
        logger.warn(
          `No email found for user ${payload.userId}. Skipping email notification.`,
        );
        return;
      }

      await transporter.sendMail({
        from: process.env.NODEMAILER_GMAIL,
        to: recipientEmail,
        subject: payload.title,
        text: payload.message,
        html: `<p>${payload.message}</p>`,
      });

      logger.info(`Email sent to ${recipientEmail}`);
    } catch (error: any) {
      logger.error(error, "Failed to send email notification:");
      throw error;
    }
  }
}
