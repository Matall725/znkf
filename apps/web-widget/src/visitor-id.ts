const STORAGE_KEY = 'znkfxt_visitor_id';

export function getOrCreateVisitorId(): string {
  const existing = localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const newId = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, newId);

  return newId;
}

export function clearVisitorId(): void {
  localStorage.removeItem(STORAGE_KEY);
}
