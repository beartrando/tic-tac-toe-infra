export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isPromise<T>(
    value: unknown,
): value is Promise<T> {
  return value instanceof Promise;
}

export async function retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (i + 1 < retries) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}