import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { OTP } from "../user/user.model";
import { transporter } from "../../utils/nodemailer";

dayjs.extend(utc);
dayjs.extend(timezone);

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getStoredOTP = async (email: string) => {
  const otpData = await OTP.findOne({ email: email.toLowerCase() });

  if (!otpData) {
    return { status: "not_found", otp: null };
  }

  // Expired case
  if (otpData.expiresAt < new Date()) {
    await OTP.deleteOne({ email: email.toLowerCase() }); // remove expired OTP
    return { status: "expired", otp: null };
  }

  return { status: "valid", otp: otpData.otp, verified: otpData.verified };
};

export const saveOTP = async (email: string, otp: string) => {
  await OTP.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 160 * 1000), // 2 minutes expiry
      verified: false,
    },
    { upsert: true },
  );
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
): Promise<void> => {
  const brandColor = "#1AC8DB";

  const emailContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
    <style>
      body { margin: 0; padding: 0; background-color: #f4f7fa; -webkit-font-smoothing: antialiased; }
      .email-wrapper { width: 100%; table-layout: fixed; background-color: #f4f7fa; padding-bottom: 40px; }
      .email-card { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #eef2f6; }
      .header { padding: 40px 0 20px; text-align: center; }
      .logo { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 800; color: ${brandColor}; letter-spacing: -1px; }
      .content { padding: 0 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3436; }
      .title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; text-align: center; }
      .text { font-size: 15px; line-height: 24px; color: #636e72; text-align: center; }
      .otp-box { background-color: #f8faff; border: 1px solid #e1e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; }
      .otp-label { font-size: 12px; font-weight: 700; color: #a0a0a0; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
      .otp-code { font-size: 40px; font-weight: 800; color: #1a1a1a; letter-spacing: 8px; margin: 0; }
      .timer-badge { display: inline-block; padding: 6px 12px; background-color: #fff2f2; color: #e74c3c; font-size: 13px; font-weight: 600; border-radius: 20px; margin-bottom: 20px; }
      .footer { padding: 20px; text-align: center; font-size: 12px; color: #b2bec3; font-family: sans-serif; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-card">
        <div class="header">
          <div class="logo">ERP-Management</div>
        </div>
        <div class="content">
          <h1 class="title">Verification Code</h1>
          <p class="text">To securely sign in to your <strong>ERP-Management</strong> account, please use the code below. This code will expire shortly.</p>
          
          <div class="otp-box">
            <div class="timer-badge">Valid for 3 minutes</div> 
            <div class="otp-code">${otp}</div>
          </div>
          
          <p class="text" style="font-size: 13px;">If you didn't request this, you can safely ignore this email. Your account security is our priority.</p>
          
          <p class="text" style="margin-top: 30px; font-weight: 600; color: #2d3436;">
            Thanks,<br>Team ERP-Management
          </p>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} ERP-Management Inc. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;

  const mailOptions = {
    from: `"ERP-Management" <${process.env.Nodemailer_GMAIL}>`,
    to: email,
    subject: `${otp} is your verification code`,
    html: emailContent,
    text: `Your verification code is ${otp}. Valid for 3 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};
