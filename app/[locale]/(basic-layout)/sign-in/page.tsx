import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SignInPage from "./SignInPage";

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
    page: "Sign In",
    title: t("meta.signin.title"),
    description: t("meta.signin.description"),
    locale: locale as Locale,
    path: `/sign-in`,
  });
}

export default function Page() {
  return <SignInPage />;
}

