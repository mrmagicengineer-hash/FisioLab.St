type SecurityRecord = {
    failedAttempts: number;
    lockedUntil: number | null;
}

type SecurityStore = Record<string, SecurityRecord>;

const STORAGE_KEY = 'fisiolab:login-security';

function getStore(): SecurityStore {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(! raw) return {}

    try {
        return JSON.parse(raw) as SecurityStore;
    }catch {
        return {};
    }
}

function setStore(store: SecurityStore) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getUserSecurity(username: string): SecurityRecord {
    const store = getStore()
    return store[username] ?? { failedAttempts: 0, lockedUntil: null };
}

export function setUserSecurity(username: string, record: SecurityRecord) {
    const store = getStore();
    store[username] = record;
    setStore(store);
}