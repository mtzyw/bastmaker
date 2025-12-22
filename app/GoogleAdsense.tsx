"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isMarketingRoute } from "@/lib/route-utils";

const GoogleAdsense = () => {
  const pathname = usePathname();

  if (!isMarketingRoute(pathname)) {
    return null;
  }

  return (
    <>
      {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID ? (
        <>
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default GoogleAdsense;
