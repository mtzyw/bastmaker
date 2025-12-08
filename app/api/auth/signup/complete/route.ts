import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/email";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { SIGNUP_OTP_PURPOSE } from "@/lib/auth/signup-otp";

const EMAIL_ALREADY_REGISTERED = "EMAIL_ALREADY_REGISTERED";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token: string | undefined = body?.token;
    const username: string = body?.username?.trim?.() ?? "";
    const password: string | undefined = body?.password;
    const parsedWelcomeCredits = parseInt(process.env.NEXT_PUBLIC_WELCOME_CREDITS ?? "0", 10);
    const welcomeCredits = Number.isFinite(parsedWelcomeCredits) ? parsedWelcomeCredits : 0;

    if (!token || !username || !password) {
      return NextResponse.json({ error: "缺少必要信息" }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `密码至少需要 ${MIN_PASSWORD_LENGTH} 位` }, { status: 400 });
    }

    const supabaseAdmin = getServiceRoleClient();

    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from("auth_email_otps")
      .select("*")
      .eq("purpose", SIGNUP_OTP_PURPOSE)
      .eq("status", "verified")
      .eq("payload_json->>verification_token", token)
      .maybeSingle();

    if (fetchError) {
      console.error("[signup][complete] Fetch OTP error:", fetchError);
      return NextResponse.json({ error: "注册失败，请重新尝试" }, { status: 500 });
    }

    if (!otpRecord || !otpRecord.email) {
      return NextResponse.json({ error: "验证码已失效，请重新验证" }, { status: 400 });
    }

    if (otpRecord.expires_at && new Date(otpRecord.expires_at) < new Date()) {
      await supabaseAdmin.from("auth_email_otps").update({ status: "expired" }).eq("id", otpRecord.id);
      return NextResponse.json({ error: "验证码已过期，请重新获取" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(otpRecord.email);

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
      console.error("[signup][complete] Failed to check existing profile:", existingProfileError);
      return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
    }

    if (existingProfile?.id) {
      return NextResponse.json(
        { error: EMAIL_ALREADY_REGISTERED },
        { status: 409 },
      );
    }

    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: username,
      },
    });

    if (createError) {
      console.error("[signup][complete] Create user error:", createError);
      return NextResponse.json({ error: createError.message ?? "创建账号失败" }, { status: 400 });
    }

    const existingPayload = (otpRecord.payload_json as Record<string, any>) ?? {};
    const payloadToStore = {
      ...existingPayload,
      verification_token: token,
      created_user_id: createdUser.user?.id ?? null,
    };

    if (welcomeCredits > 0 && createdUser.user?.id) {
      const { error: welcomeError } = await supabaseAdmin.rpc("grant_welcome_credits_and_log", {
        p_user_id: createdUser.user.id,
        p_welcome_credits: welcomeCredits,
      });

      if (welcomeError) {
        console.error("[signup][complete] Failed to grant welcome credits:", welcomeError);
      }
    }

    await supabaseAdmin
      .from("auth_email_otps")
      .update({
        status: "used",
        used_at: new Date().toISOString(),
        payload_json: payloadToStore,
      })
      .eq("id", otpRecord.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[signup][complete] Unexpected error:", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
