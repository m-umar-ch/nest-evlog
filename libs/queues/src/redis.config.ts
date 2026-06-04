export type RedisConnectionConfig =
  | { url: string }
  | { host: string; port: number };

export function getRedisConnection(): RedisConnectionConfig {
  const url = process.env.REDIS_URL;
  if (url) {
    return { url };
  }

  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  };
}
