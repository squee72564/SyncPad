export default function pick<T extends Record<string, unknown>>(
  object: T,
  keys: string[]
): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      result[key] = object[key];
    }
  }

  return result as Partial<T>;
}
