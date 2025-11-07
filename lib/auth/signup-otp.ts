import crypto from "crypto";

export const SIGNUP_OTP_PURPOSE = "signup";
export const SIGNUP_OTP_EXPIRATION_MINUTES = 10;
export const SIGNUP_OTP_MAX_ATTEMPTS = 5;

export const hashSignupCode = (code: string) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};

export const generateSignupCode = () => {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
};

export const getSignupCodeExpiryISO = () => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + SIGNUP_OTP_EXPIRATION_MINUTES);
  return expiresAt.toISOString();
};
