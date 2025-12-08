export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ID || null;

type GAEventPayload = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

export const pageview = (url: string) => {
  if (typeof window === "undefined" || !GA_TRACKING_ID) {
    return;
  }
  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }: GAEventPayload) => {
  if (typeof window === "undefined" || !GA_TRACKING_ID) {
    return;
  }
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
