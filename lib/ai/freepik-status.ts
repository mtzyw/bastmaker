export function mapFreepikStatus(status?: string | null) {
  const normalized = status?.toUpperCase();
  switch (normalized) {
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    case "IN_PROGRESS":
      return "processing";
    default:
      return "queued";
  }
}
