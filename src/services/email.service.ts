import nodemailer from "nodemailer";
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} from "../configs/constant";

export const SMTP_CONFIGURED = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

export class EmailService {
  private static transporterPromise: Promise<nodemailer.Transporter> | null = null;

  private static async getTransporter(): Promise<nodemailer.Transporter> {
    // During Jest tests, don't connect to any SMTP server.
    if (process.env.NODE_ENV === "test") {
      return nodemailer.createTransport({
        jsonTransport: true,
      });
    }

    if (SMTP_CONFIGURED) {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      try {
        await transporter.verify();
        console.log("[Email] SMTP connection verified successfully");
      } catch (err: any) {
        console.warn("[Email] SMTP connection verification failed:", err.message);
        console.warn("[Email] Emails may not be delivered. Check SMTP configuration.");
      }

      return transporter;
    }

    if (!this.transporterPromise) {
      this.transporterPromise = (async () => {
        try {
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Ethereal account creation timed out")), 8000)
          );

          const testAccount = await Promise.race([
            nodemailer.createTestAccount(),
            timeout,
          ]);

          console.log("[Email] Ethereal test account created:", testAccount.user);

          return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
          });
        } catch (err: any) {
          console.warn("[Email] Could not create Ethereal account:", err.message);
          console.warn("[Email] Emails will be logged to console only.");

          return nodemailer.createTransport({
            jsonTransport: true,
          });
        }
      })();
    }

    return this.transporterPromise;
  }

  public static async sendPasswordResetEmail(
    toEmail: string,
    resetUrl: string,
    userName: string
  ): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto; padding:20px; border:1px solid #e0e0e0; border-radius:12px;">
          <h2 style="color:#2f6f7e;">Doctor Appointment System</h2>
          <p>Hello ${userName || "User"},</p>
          <p>We received a request to reset your password.</p>

          <p style="text-align:center; margin:30px 0;">
            <a href="${resetUrl}" style="background:#2f6f7e;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>

          <p>This link expires in 1 hour.</p>

          <p>
            If the button doesn't work, copy this link:
            <br/>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>
      `;

      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: "Password Reset Request - Doctor Appointment System",
        html: htmlContent,
      });

      console.log("[Email] Password reset email processed successfully.");
      console.log("[Email] Recipient:", toEmail);

      if (process.env.NODE_ENV !== "test") {
        const previewUrl = nodemailer.getTestMessageUrl(info as any);

        if (previewUrl) {
          console.log("[Email] Preview URL:", previewUrl);
        }

        if (!SMTP_CONFIGURED) {
          console.log("==========================================");
          console.log("Development Password Reset URL");
          console.log(resetUrl);
          console.log("==========================================");
        }
      }

      return true;
    } catch (error: any) {
      console.error("[Email] Failed to send password reset email:", error.message);

      if (process.env.NODE_ENV !== "test") {
        console.error("[Email] Recipient:", toEmail);
        console.error("[Email] Reset URL:", resetUrl);

        if (error.code) {
          console.error("[Email] Error Code:", error.code);
        }
      }

      return false;
    }
  }

  public static async sendPaymentOtpEmail(
    toEmail: string,
    otp: string,
    userName: string,
    channel: "email" | "sms" = "email",
    phone?: string
  ): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto; padding:20px; border:1px solid #e0e0e0; border-radius:12px;">
          <h2 style="color:#2f6f7e;">Doctor Appointment System</h2>
          <p>Hello ${userName || "User"},</p>
          <p>Your payment verification code is:</p>

          <p style="text-align:center; margin:30px 0;">
            <span style="font-size:28px; font-weight:bold; letter-spacing:4px; color:#2f6f7e;">
              ${otp}
            </span>
          </p>

          <p>This code expires in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `;

      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: "Your Payment Verification Code - Doctor Appointment System",
        html: htmlContent,
      });

      console.log("[Email] Payment OTP email processed successfully.");
      console.log("[Email] Recipient:", toEmail);
      console.log("[Email] Channel:", channel);

      if (process.env.NODE_ENV !== "test") {
        const previewUrl = nodemailer.getTestMessageUrl(info as any);

        if (previewUrl) {
          console.log("[Email] Preview URL:", previewUrl);
        }

        if (!SMTP_CONFIGURED) {
          console.log("==========================================");
          console.log("Development Payment OTP");
          console.log(otp);
          console.log("==========================================");
        }
      }

      return true;
    } catch (error: any) {
      console.error("[Email] Failed to send payment OTP email:", error.message);

      if (process.env.NODE_ENV !== "test") {
        console.error("[Email] Recipient:", toEmail);

        if (error.code) {
          console.error("[Email] Error Code:", error.code);
        }
      }

      return false;
    }
  }
}
