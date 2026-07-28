import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { UserMongoRepository } from "../repositories/user.repository";
import { EmailService } from "./email.service";
import { HttpException } from "../exception/http-exception";

const userRepository = new UserMongoRepository();

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***.***";
  const masked = local.length <= 2 ? "**" : `${local[0]}${"*".repeat(Math.min(local.length - 2, 4))}${local.slice(-1)}`;
  return `${masked}@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}

export class PaymentVerificationService {
  async verifyWalletCredentials(userId: string, contactNumber: string, password: string, paymentMethod: string, amount: number) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new HttpException(404, "User not found");
    const registeredPhone = user.contactNumber || user.phone || "";
    if (!phonesMatch(contactNumber, registeredPhone)) {
      throw new HttpException(400, "Mobile number does not match your registered account");
    }
    const match = await bcryptjs.compare(password, user.password);
    if (!match) throw new HttpException(400, "Incorrect password");
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await userRepository.update(userId, { paymentOtpHash: otpHash, paymentOtpExpires: expires, paymentOtpChannel: null } as any);
    return { verified: true, message: "Credentials verified. Request OTP to continue.", paymentMethod, amount, maskedEmail: maskEmail(user.email), maskedPhone: maskPhone(registeredPhone) };
  }

  async sendPaymentOtp(userId: string, channel: "email" | "sms" = "email") {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new HttpException(404, "User not found");
    const otpHash = (user as any).paymentOtpHash;
    const otpExpires = (user as any).paymentOtpExpires;
    if (!otpHash || !otpExpires || new Date(otpExpires) < new Date()) {
      throw new HttpException(400, "Please verify your wallet credentials first");
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const newHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await userRepository.update(userId, { paymentOtpHash: newHash, paymentOtpExpires: expires, paymentOtpChannel: channel } as any);
    const registeredPhone = user.contactNumber || user.phone || "";
    if (channel === "email") {
      await EmailService.sendPaymentOtpEmail(user.email, otp, user.fullName, "email");
      return { sent: true, channel: "email" as const, destination: maskEmail(user.email), message: `Verification code sent to ${maskEmail(user.email)}` };
    }
    await EmailService.sendPaymentOtpEmail(user.email, otp, user.fullName, "sms", registeredPhone);
    return { sent: true, channel: "sms" as const, destination: maskPhone(registeredPhone), message: `Verification code sent to ${maskPhone(registeredPhone)}` };
  }

  async verifyPaymentOtp(userId: string, otp: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new HttpException(404, "User not found");
    const storedHash = (user as any).paymentOtpHash;
    const expires = (user as any).paymentOtpExpires;
    if (!storedHash || !expires) throw new HttpException(400, "No pending verification. Please start again.");
    if (new Date(expires) < new Date()) {
      await userRepository.update(userId, { paymentOtpHash: null, paymentOtpExpires: null, paymentOtpChannel: null } as any);
      throw new HttpException(400, "Verification code has expired. Please request a new one.");
    }
    const inputHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (inputHash !== storedHash) throw new HttpException(400, "Invalid verification code");
    await userRepository.update(userId, { paymentOtpHash: null, paymentOtpExpires: null, paymentOtpChannel: null } as any);
    return { verified: true, message: "Payment authorized successfully" };
  }
}
