import { validateEmail as validateEmailFormat } from "@/lib/email";
import { EMAIL_DOMAIN_ALLOWLIST } from "@/lib/email-allowlist";

export type EmailValidationError =
  | "invalid_email_format"
  | "email_part_too_long"
  | "invalid_characters"
  | "disposable_email_not_allowed"
  | "domain_not_allowed";

export function validateEmailServer(email: string): {
  isValid: boolean;
  error?: EmailValidationError | string;
} {
  // 1. Basic format validation (shared with client)
  const formatResult = validateEmailFormat(email);
  if (!formatResult.isValid) {
    return formatResult;
  }

  // 2. Allowlist check (server-only)
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain && !EMAIL_DOMAIN_ALLOWLIST.has(domain)) {
    return {
      isValid: false,
      error: "domain_not_allowed",
    };
  }

  return { isValid: true };
}
