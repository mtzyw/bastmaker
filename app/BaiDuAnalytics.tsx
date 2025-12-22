"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isMarketingRoute } from "@/lib/route-utils";

const BaiDuAnalytics = () => {
  const pathname = usePathname();

  if (!isMarketingRoute(pathname)) {
    return null;
  }

  return (
    <>
      {process.env.NEXT_PUBLIC_BAIDU_TONGJI ? (
        <>
          <Script
            id="baidu-tongji"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
              var _hmt = _hmt || [];
              (function() {
                var hm = document.createElement("script");
                hm.src = "https://hm.baidu.com/hm.js?${process.env.NEXT_PUBLIC_BAIDU_TONGJI}";
                var s = document.getElementsByTagName("script")[0]; 
                s.parentNode.insertBefore(hm, s);
              })();
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

export default BaiDuAnalytics;
