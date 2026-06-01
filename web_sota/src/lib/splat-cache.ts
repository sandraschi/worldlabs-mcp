const DB_NAME = "worldlabs-splat-cache";
const DB_VERSION = 1;
const STORE_NAME = "splats";

interface CacheEntry {
	blob: Blob;
	timestamp: number;
	size: number;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function getCachedSplat(key: string): Promise<CacheEntry | null> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const req = tx.objectStore(STORE_NAME).get(key);
			req.onsuccess = () => {
				resolve(req.result ?? null);
				db.close();
			};
			req.onerror = () => {
				db.close();
				resolve(null);
			};
		});
	} catch {
		return null;
	}
}

export async function cacheSplat(key: string, blob: Blob): Promise<void> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const entry: CacheEntry = {
				blob,
				timestamp: Date.now(),
				size: blob.size,
			};
			const tx = db.transaction(STORE_NAME, "readwrite");
			tx.objectStore(STORE_NAME).put(entry, key);
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => {
				db.close();
				resolve();
			};
		});
	} catch {
		// silently fail
	}
}

export async function clearSplatCache(): Promise<void> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			tx.objectStore(STORE_NAME).clear();
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => {
				db.close();
				resolve();
			};
		});
	} catch {
		// silently fail
	}
}

export interface CachedSplatMeta {
	key: string;
	size: number;
	timestamp: number;
	label: string;
}

export async function listCachedSplats(): Promise<CachedSplatMeta[]> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const store = tx.objectStore(STORE_NAME);
			const req = store.openCursor();
			const results: CachedSplatMeta[] = [];
			req.onsuccess = () => {
				const cursor = req.result;
				if (cursor) {
					const entry = cursor.value as CacheEntry;
					results.push({
						key: cursor.key as string,
						size: entry.size,
						timestamp: entry.timestamp,
						label: cursor.key as string,
					});
					cursor.continue();
				} else {
					db.close();
					resolve(results);
				}
			};
			req.onerror = () => {
				db.close();
				resolve([]);
			};
		});
	} catch {
		return [];
	}
}

export async function deleteCachedSplat(key: string): Promise<void> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			tx.objectStore(STORE_NAME).delete(key);
			tx.oncomplete = () => {
				db.close();
				resolve();
			};
			tx.onerror = () => {
				db.close();
				resolve();
			};
		});
	} catch {
		// silently fail
	}
}

export async function getSplatCacheSize(): Promise<number> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const store = tx.objectStore(STORE_NAME);
			const keysReq = store.getAllKeys();
			keysReq.onsuccess = async () => {
				const keys = keysReq.result;
				let total = 0;
				for (const key of keys) {
					const getReq = store.get(key);
					await new Promise<void>((r) => {
						getReq.onsuccess = () => {
							total += (getReq.result as CacheEntry)?.size ?? 0;
							r();
						};
						getReq.onerror = () => r();
					});
				}
				db.close();
				resolve(total);
			};
			keysReq.onerror = () => {
				db.close();
				resolve(0);
			};
		});
	} catch {
		return 0;
	}
}

export async function getStorageQuota(): Promise<{
	usage: number;
	quota: number;
}> {
	try {
		if (!navigator.storage?.estimate) return { usage: 0, quota: 0 };
		const est = await navigator.storage.estimate();
		return {
			usage: est.usage ?? 0,
			quota: est.quota ?? 0,
		};
	} catch {
		return { usage: 0, quota: 0 };
	}
}
