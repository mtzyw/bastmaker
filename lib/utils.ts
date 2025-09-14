import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getDomain = (url: string) => {
  try {
    const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
    const domain = new URL(urlWithProtocol).hostname;
    return domain.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
};

export const formatCurrency = (
  amount: number | null | undefined,
  currency: string | null | undefined
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "-";
  }
  const effectiveCurrency = currency || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || "usd";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: effectiveCurrency.toUpperCase(),
    }).format(amount);
  } catch (e) {
    console.error("Error formatting currency:", e);
    return `${amount.toFixed(2)} ${effectiveCurrency.toUpperCase()}`;
  }
};


export const getURL = (path: string = '') => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000';
  url = url.includes('http') ? url : `https://${url}`;
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  url = `${url}${path}`;
  return url;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function formatTimestampWithIntl(dateString: string, locale: string = 'en') {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Intl.DateTimeFormat(locale, options).format(new Date(dateString));
}

export const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case "succeeded":
      return "bg-green-500 text-white dark:bg-green-600";
    case "failed":
      return "bg-red-500 text-white dark:bg-red-600";
    case "processing":
      return "bg-blue-500 text-white dark:bg-blue-600";
    case "starting":
      return "bg-yellow-500 text-white dark:bg-yellow-600";
    default:
      return "bg-gray-500 text-white dark:bg-gray-600";
  }
};

export function formatValue(value: number | string, unit: "count" | "revenue") {
  if (unit === "revenue") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value));
  }
  return value.toLocaleString();
}