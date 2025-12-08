export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ID || null;

export const pageview = (url) => {
  if (typeof window === "undefined" || !GA_TRACKING_ID) {
    return;
  }
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }) => {
  if (typeof window === "undefined" || !GA_TRACKING_ID) {
    return;
  }
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
