export function formatProviderError(error: unknown): string | undefined {
  if (error == null) {
    return undefined;
  }

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (error instanceof Error) {
    return error.message;
  }

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") {
      return serialized;
    }
  } catch (serializationError) {
    console.error("[provider-error] failed to stringify", serializationError);
  }

  try {
    return String(error);
  } catch {
    return undefined;
  }
}
