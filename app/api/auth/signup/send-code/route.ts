import { NextResponse } from "next/server";
import * as React from "react";

import { SignupOtpEmail } from "@/emails/signup-otp";
import { siteConfig } from "@/config/site";
import { normalizeEmail, validateEmail } from "@/lib/email";
import resend from "@/lib/resend";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import {
  generateSignupCode,
  getSignupCodeExpiryISO,
  hashSignupCode,
  SIGNUP_OTP_PURPOSE,
} from "@/lib/auth/signup-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email: string | undefined = body?.email;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const { isValid, error } = validateEmail(normalizedEmail);
    if (!isValid) {
      return NextResponse.json(
        { error: error === "disposable_email_not_allowed" ? "该邮箱不支持注册" : "邮箱格式不正确" },
        { status: 400 }
      );
    }

    if (!resend) {
      return NextResponse.json({ error: "邮件服务暂不可用" }, { status: 500 });
    }

    const supabaseAdmin = getServiceRoleClient();

    // Check if the email already exists in user profiles
    const {
      data: existingProfile,
      error: existingProfileError,
    } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (existingProfileError && existingProfileError.code !== "PGRST116") {
      console.error("[signup][send-code] Failed to check existing user profile:", existingProfileError);
      return NextResponse.json({ error: "暂时无法验证邮箱，请稍后重试" }, { status: 500 });
    }

    if (existingProfile?.id) {
      return NextResponse.json({ error: "该邮箱已注册，请直接登录" }, { status: 409 });
    }

    // Expire previous pending codes
    await supabaseAdmin
      .from("auth_email_otps")
      .update({ status: "expired" })
      .eq("email", normalizedEmail)
      .eq("purpose", SIGNUP_OTP_PURPOSE)
      .eq("status", "pending");

    const code = generateSignupCode();
    const codeHash = hashSignupCode(code);
    const expiresAt = getSignupCodeExpiryISO();

    const { error: insertError } = await supabaseAdmin.from("auth_email_otps").insert({
      email: normalizedEmail,
      code_hash: codeHash,
      purpose: SIGNUP_OTP_PURPOSE,
      status: "pending",
      expires_at: expiresAt,
      payload_json: {},
    });

    if (insertError) {
      console.error("[signup][send-code] Failed to insert OTP:", insertError);
      return NextResponse.json({ error: "发送验证码失败，请稍后重试" }, { status: 500 });
    }

    const fromEmail = process.env.ADMIN_EMAIL ?? "hi@bestmaker.ai";
    const fromName = process.env.ADMIN_NAME ?? siteConfig.name;

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: normalizedEmail,
      subject: `Bestmaker | Your verification code: ${code}`,
      react: React.createElement(SignupOtpEmail, { code, email: normalizedEmail }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[signup][send-code] Unexpected error:", error);
    return NextResponse.json({ error: "发送验证码失败，请稍后重试" }, { status: 500 });
  }
}
