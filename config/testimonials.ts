export interface TweetConfig {
  id: string;
}

export const TWEET_IDS: TweetConfig[] = [
  {
    id: '1928143010811748863'
  },
  {
    id: '1938257909726519640'
  },
  {
    id: '1932849225802649839'
  },
  {
    id: '1942036712403976403'
  },
  {
    id: '1942144580050461053'
  },
  {
    id: '1929798258781511774'
  },
  {
    id: '1937375832994984200'
  }
];

export const SIMPLE_TWEET_IDS: string[] = TWEET_IDS.map(tweet => tweet.id);

export function getTweetIds(): string[] {
  return TWEET_IDS.map(tweet => tweet.id);
}

export function getTweetConfigs(): TweetConfig[] {
  return TWEET_IDS;
} 