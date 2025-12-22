"use client";

import Script from "next/script";
import * as gtag from "../gtag";
import { isMarketingRoute } from "@/lib/route-utils";
import { usePathname } from "next/navigation";

const GoogleAnalytics = () => {
  const pathname = usePathname();

  if (!isMarketingRoute(pathname)) {
    return null;
  }

  return (
    <>
      {gtag.GA_TRACKING_ID ? (
        <>
          <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
          />
          <Script
            id="gtag-init"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gtag.GA_TRACKING_ID}', {
                page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default GoogleAnalytics;
