import { inHTMLData } from "xss-filters";

type PlainObject = { [k: string]: unknown };

function isPlainObject(value: unknown): value is PlainObject {
  return (
    value !== null &&
    !Array.isArray(value) &&
    typeof value === "object" &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    !(value instanceof Buffer)
  );
}

export function clean<T>(data: T): T {
  if (typeof data === "string") {
    return inHTMLData(data).trim() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => clean(item)) as unknown as T;
  }

  if (isPlainObject(data)) {
    const out: PlainObject = {};
    for (const key of Object.keys(data as PlainObject)) {
      if (Object.prototype.hasOwnProperty.call(data as PlainObject, key)) {
        out[key] = clean((data as PlainObject)[key]);
      }
    }
    return out as T;
  }

  return data;
}
