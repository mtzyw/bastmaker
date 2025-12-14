"use client";

import Script from "next/script";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;

const PlausibleAnalytics = () => {
  if (!PLAUSIBLE_SRC) {
    return null;
  }

  const domainAttribute = PLAUSIBLE_DOMAIN ? { "data-domain": PLAUSIBLE_DOMAIN } : {};

  return (
    <>
      <Script
        id="plausible-script"
        strategy="beforeInteractive"
        src={PLAUSIBLE_SRC}
        {...domainAttribute}
      />
      <Script
        id="plausible-init"
        strategy="beforeInteractive"
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
