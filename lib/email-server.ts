import { validateEmail as validateEmailFormat } from "@/lib/email";
import { EMAIL_DOMAIN_BLACKLIST } from "@/lib/email-blacklist";

export type EmailValidationError =
  | "invalid_email_format"
  | "email_part_too_long"
  | "disposable_email_not_allowed"
  | "invalid_characters"
  | "blacklisted_domain";

export function validateEmailServer(email: string): {
  isValid: boolean;
  error?: EmailValidationError | string;
} {
  // 1. Basic format validation (shared with client)
  const formatResult = validateEmailFormat(email);
  if (!formatResult.isValid) {
    return formatResult;
  }

  // 2. Blacklist check (server-only)
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain && EMAIL_DOMAIN_BLACKLIST.has(domain)) {
    return {
      isValid: false,
      error: "disposable_email_not_allowed", // Re-use this error code for consistent UI message
    };
  }

  return { isValid: true };
}
