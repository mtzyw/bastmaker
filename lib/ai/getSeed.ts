export function getSeedFromReplicateLogs(logsString: string) {
  const match = logsString.match(/Using seed: (\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return null;
}