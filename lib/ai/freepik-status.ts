export function mapFreepikStatus(status?: string | null) {
  const normalized = status?.toUpperCase();
  switch (normalized) {
    case "DONE":
    case "SUCCESS":
    case "SUCCEEDED":
    case "COMPLETED":
      return "completed";
    case "ERROR":
    case "FAILED":
    case "CANCELLED":
    case "CANCELED":
    case "REJECTED":
    case "ABORTED":
      return "failed";
    case "IN_PROGRESS":
    case "PROCESSING":
    case "RUNNING":
    case "STARTED":
      return "processing";
    case "QUEUED":
    case "PENDING":
    case "CREATED":
      return "queued";
    default:
      return "queued";
  }
}
