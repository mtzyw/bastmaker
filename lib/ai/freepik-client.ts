export type FreepikImagePayload = {
  prompt: string;
  aspect_ratio?: string;
  reference_images?: string[];
  webhook_url?: string;
};

export type FreepikTaskResponse = {
  data: {
    task_id: string;
    status: string;
    generated?: string[];
  };
};

const MODEL_ENDPOINT_OVERRIDES: Record<string, string> = {
  "gemini-2-5-flash-image-preview": "/v1/ai/gemini-2-5-flash-image-preview",
};

export class FreepikRequestError extends Error {
  constructor(message: string, public status?: number, public details?: unknown) {
    super(message);
    this.name = "FreepikRequestError";
  }
}

function buildEndpoint(model: string): string {
  return MODEL_ENDPOINT_OVERRIDES[model] ?? `/v1/ai/text-to-image/${model}`;
}

function getBaseUrl(): string {
  const base =
    process.env.FREEPIK_API_URL ??
    process.env.FREEPIK_API ??
    "https://api.freepik.com";
  return base.endsWith("/") ? base : `${base}/`;
}

function getApiKey(): string {
  const key = process.env.FREEPIK_KEY;
  if (!key) {
    throw new FreepikRequestError("FREEPIK_KEY is not configured", 500);
  }
  return key;
}

export async function createFreepikImageTask(
  model: string,
  payload: FreepikImagePayload
): Promise<FreepikTaskResponse | Record<string, unknown> | null> {
  const baseUrl = getBaseUrl();
  const endpoint = buildEndpoint(model).replace(/^\//, "");
  const url = new URL(endpoint, baseUrl).toString();

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": getApiKey(),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error: any) {
    throw new FreepikRequestError(error?.message ?? "Failed to reach Freepik API");
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch (error) {
    // Ignore JSON parse errors; data stays null
  }

  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "message" in (data as Record<string, unknown>)
      ? String((data as Record<string, unknown>).message)
      : `Freepik API request failed with status ${response.status}`;
    throw new FreepikRequestError(message, response.status, data);
  }

  return data as FreepikTaskResponse | Record<string, unknown> | null;
}
