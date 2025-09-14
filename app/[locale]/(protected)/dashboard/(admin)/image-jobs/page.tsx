import { getImageJobsAdmin } from "@/actions/image-jobs";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ImageJobsDataTable } from "./ImageJobsDataTable";

const PAGE_SIZE = 20;

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "ImageJobs",
  });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/image-jobs`,
  });
}

export default async function AdminImageJobsPage() {
  const locale = await getLocale();
  const t = await getTranslations("ImageJobs");

  const result = await getImageJobsAdmin({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
    locale: locale as Locale,
  });

  if (!result.success) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-destructive">
          {t("fetchError", { error: result.error ?? "Unknown error" })}
        </p>
      </div>
    );
  }

  const jobs = result.data?.jobs || [];
  const totalCount = result.data?.totalCount || 0;
  const pageCount = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <ImageJobsDataTable
        initialData={jobs}
        initialPageCount={pageCount}
        pageSize={PAGE_SIZE}
        totalCount={totalCount}
      />
    </div>
  );
}
