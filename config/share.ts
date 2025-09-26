function parseIntegerEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

export const shareRewardConfig = {
  ownerCredits: parseIntegerEnv('SHARE_OWNER_REWARD_CREDITS', 20),
  inviteeCredits: parseIntegerEnv('SHARE_INVITEE_REWARD_CREDITS', 30),
  maxRewardsPerJob: parseIntegerEnv('SHARE_REWARD_MAX_PER_JOB', 100),
};

export const SHARE_REWARD_OWNER_LOG_TYPE = 'share_reward_owner';
export const SHARE_REWARD_INVITEE_LOG_TYPE = 'share_reward_invitee';
