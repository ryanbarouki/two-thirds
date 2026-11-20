const STORAGE_KEY = 'usernames';
let cachedEntries = {};

export const loadEntries = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...stored, ...cachedEntries };
  } catch {
    return cachedEntries;
  }
};

export const getEntry = (entries, day) => {
  const entry = entries[day];
  return typeof entry === 'string' ? { username: entry, guess: null } : entry;
};

export const getLastUsername = (entries, day) => {
  const latest = Object.keys(entries).filter(key => key <= day).sort().pop();
  return getEntry(entries, latest)?.username ?? '';
};

export const saveEntry = (day, entry) => {
  const entries = { ...loadEntries(), [day]: entry };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    cachedEntries = {};
  } catch {
    cachedEntries = entries;
  }
  return entries;
};
