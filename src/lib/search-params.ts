export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function toUrlSearchParams(searchParams: PageSearchParams) {
  const resolved = await searchParams;
  const params = new URLSearchParams();

  Object.entries(resolved).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    if (value !== undefined) {
      params.set(key, value);
    }
  });

  return params;
}
