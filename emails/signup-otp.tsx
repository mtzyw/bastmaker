import { siteConfig } from "@/config/site";
import * as React from "react";

type SignupOtpEmailProps = {
  code: string;
  email?: string;
  expiresInMinutes?: number;
};

const tableStyle: React.CSSProperties = {
  fontFamily: "'SF Pro Display', 'Segoe UI', Arial, sans-serif",
  backgroundColor: "#f5f7fb",
  padding: "32px 0",
  margin: 0,
  width: "100%",
};

const innerTableStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "40px 32px",
  width: "480px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#111827",
  textAlign: "center" as const,
};

const bodyTextStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#374151",
  paddingTop: "16px",
  lineHeight: "24px",
};

const codeStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: "36px",
  letterSpacing: "14px",
  fontWeight: 700,
  color: "#111827",
  fontFamily: "'SFMono-Regular', 'Segoe UI', Arial, sans-serif",
};

const footerStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  marginTop: "20px",
};

export const SignupOtpEmail: React.FC<SignupOtpEmailProps> = ({
  code,
  email,
  expiresInMinutes = 5,
}) => {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Bestmaker";
  const supportEmail = process.env.ADMIN_EMAIL ?? "hi@bestmaker.ai";
  const siteUrl = siteConfig.url || process.env.NEXT_PUBLIC_SITE_URL || "https://bestmaker.ai";
  const friendlyEmail = email || "there";

  return (
    <table width="100%" style={tableStyle} cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td align="center">
            <table width="480" style={innerTableStyle} cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={headingStyle}>Verify your email</td>
                </tr>
                <tr>
                  <td style={bodyTextStyle}>
                    Hi {friendlyEmail}, 👋<br />
                    Thank you for signing up for <strong>{brandName}</strong>!
                    <br />
                    Please enter the 6-digit verification code below within {expiresInMinutes} minutes to complete your
                    registration:
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ padding: "28px 0" }}>
                    <div style={codeStyle}>{code}</div>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: "13px", color: "#6b7280", lineHeight: "20px" }}>
                    If you didn’t request this, you can safely ignore this email.
                    <br />
                    Need help? Contact us at{" "}
                    <a href={`mailto:${supportEmail}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                      {supportEmail}
                    </a>
                    .
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={footerStyle}>
              © {new Date().getFullYear()} {brandName} ·{" "}
              <a href={siteUrl} style={{ color: "#9ca3af", textDecoration: "none" }}>
                {siteUrl}
              </a>
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
