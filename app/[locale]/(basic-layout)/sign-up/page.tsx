import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LoginPage from "../login/LoginPage";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Login" });

  return constructMetadata({
    page: "Sign Up",
    title: t("meta.signup.title"),
    description: t("meta.signup.description"),
    locale: locale as Locale,
    path: `/sign-up`,
  });
}

export default function SignUp() {
  return <LoginPage />;
}

