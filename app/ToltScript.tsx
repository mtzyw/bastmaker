"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isMarketingRoute } from "@/lib/route-utils";

const TOLT_ID = process.env.NEXT_PUBLIC_TOLT_ID;

const ToltScript = () => {
  const pathname = usePathname();

  if (!isMarketingRoute(pathname)) {
    return null;
  }

  return (
    <>
      {TOLT_ID ? (
        <Script
          id="tolt-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
          var toltScript = document.createElement('script');
          toltScript.src = 'https://cdn.tolt.io/tolt.js';
          toltScript.setAttribute('data-tolt', '${TOLT_ID}');
          document.head.appendChild(toltScript);
          `,
          }}
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default ToltScript;
