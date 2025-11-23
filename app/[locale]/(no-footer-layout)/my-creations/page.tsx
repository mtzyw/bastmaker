import { MyCreationsContent } from "@/components/ai/MyCreationsContent";
import { fetchUserCreations, getDefaultPageSize } from "@/lib/ai/creations";
import { createClient } from "@/lib/supabase/server";
import { constructMetadata } from "@/lib/metadata";
import { Locale } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";
import { Metadata } from "next";

const PAGE_SIZE = getDefaultPageSize();

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MyCreations" });

  return constructMetadata({
    page: "MyCreations",
    title: t("metaTitle", { defaultValue: "My Creations" }),
    description: t("metaDescription", { defaultValue: "All of your generated work in one place." }),
    locale: locale as Locale,
    path: `/my-creations`,
  });
}

function HeroSection({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
          {title}
        </h1>
      </div>

    </div>
  );
}

export default async function MyCreationsPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "MyCreations" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialItems: Awaited<ReturnType<typeof fetchUserCreations>>["items"] = [];
  let totalCount = 0;

  if (user) {
    try {
      const result = await fetchUserCreations(supabase, user.id, 0, PAGE_SIZE);
      initialItems = result.items;
      totalCount = result.totalCount;
    } catch (error) {
      console.error("[my-creations] initial load failed", error);
    }
  }

  return (
    <div className="min-h-screen w-full header-bg text-white">
      <div className="container mx-auto flex min-h-screen flex-col gap-10 px-4 py-12 md:px-8">
        <div className="max-w-4xl">
          <HeroSection title={t("metaTitle", { defaultValue: "My Creations" })} />
        </div>

        <div className="flex-1">
          <MyCreationsContent
            initialItems={initialItems}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            isAuthenticated={Boolean(user)}
          />
        </div>

      </div>
    </div>
  );
}
