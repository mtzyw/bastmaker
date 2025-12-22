"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isMarketingRoute } from "@/lib/route-utils";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;

const PlausibleAnalytics = () => {
  const pathname = usePathname();

  if (!isMarketingRoute(pathname)) {
    return null;
  }

  if (!PLAUSIBLE_SRC) {
    return null;
  }

  const domainAttribute = PLAUSIBLE_DOMAIN ? { "data-domain": PLAUSIBLE_DOMAIN } : {};

  return (
    <>
      <Script
        id="plausible-script"
        strategy="lazyOnload"
        src={PLAUSIBLE_SRC}
        {...domainAttribute}
      />
      <Script
        id="plausible-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.plausible = window.plausible || function () {
              (window.plausible.q = window.plausible.q || []).push(arguments)
            };
            window.plausible.init = window.plausible.init || function (options) {
              window.plausible.o = options || {};
            };
            window.plausible.init();
          `,
        }}
      />
    </>
  );
};

export default PlausibleAnalytics;
