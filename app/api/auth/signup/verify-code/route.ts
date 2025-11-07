import crypto from "crypto";
import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/email";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import {
  hashSignupCode,
  SIGNUP_OTP_PURPOSE,
  SIGNUP_OTP_MAX_ATTEMPTS,
} from "@/lib/auth/signup-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email: string | undefined = body?.email;
    const code: string | undefined = body?.code;

    if (!email || !code) {
      return NextResponse.json({ error: "缺少邮箱或验证码" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const supabaseAdmin = getServiceRoleClient();

    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from("auth_email_otps")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("purpose", SIGNUP_OTP_PURPOSE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("[signup][verify-code] Fetch OTP error:", fetchError);
      return NextResponse.json({ error: "验证码验证失败" }, { status: 500 });
    }

    if (!otpRecord) {
      return NextResponse.json({ error: "请先获取验证码" }, { status: 404 });
    }

    if (otpRecord.status && !["pending", "verified"].includes(otpRecord.status)) {
      return NextResponse.json({ error: "验证码已失效，请重新获取" }, { status: 400 });
    }

    if (otpRecord.expires_at && new Date(otpRecord.expires_at) < new Date()) {
      await supabaseAdmin.from("auth_email_otps").update({ status: "expired" }).eq("id", otpRecord.id);
      return NextResponse.json({ error: "验证码已过期，请重新获取" }, { status: 400 });
    }

    const hashedInput = hashSignupCode(code);
    if (otpRecord.code_hash !== hashedInput) {
      const attempts = (otpRecord.attempts ?? 0) + 1;
      const updateData: Record<string, any> = { attempts };
      if (attempts >= SIGNUP_OTP_MAX_ATTEMPTS) {
        updateData.status = "expired";
      }
      await supabaseAdmin.from("auth_email_otps").update(updateData).eq("id", otpRecord.id);
      return NextResponse.json({ error: "验证码不正确" }, { status: 400 });
    }

    const existingPayload = (otpRecord.payload_json as Record<string, any>) ?? {};
    const reuseToken =
      otpRecord.status === "verified" && typeof existingPayload.verification_token === "string"
        ? existingPayload.verification_token
        : null;

    const verificationToken = reuseToken ?? crypto.randomUUID();

    await supabaseAdmin
      .from("auth_email_otps")
      .update({
        status: "verified",
        payload_json: { ...existingPayload, verification_token: verificationToken },
      })
      .eq("id", otpRecord.id);

    return NextResponse.json({ success: true, token: verificationToken });
  } catch (error) {
    console.error("[signup][verify-code] Unexpected error:", error);
    return NextResponse.json({ error: "验证码验证失败" }, { status: 500 });
  }
}
