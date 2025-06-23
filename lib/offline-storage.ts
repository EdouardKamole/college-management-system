// IndexedDB wrapper for offline data storage
class OfflineStorage {
  private dbName = "uafc-cms-db"
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains("courses")) {
          db.createObjectStore("courses", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("grades")) {
          db.createObjectStore("grades", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("exams")) {
          db.createObjectStore("exams", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("schedules")) {
          db.createObjectStore("schedules", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("pendingSync")) {
          const syncStore = db.createObjectStore("pendingSync", { keyPath: "id", autoIncrement: true })
          syncStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("userPreferences")) {
          db.createObjectStore("userPreferences", { keyPath: "key" })
        }
      }
    })
  }

  async store(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get(storeName: string, key: string): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async addPendingSync(data: {
    url: string
    method: string
    headers: Record<string, string>
    body: string
    timestamp: number
  }): Promise<void> {
    return this.store("pendingSync", data)
  }

  async getPendingSync(): Promise<any[]> {
    return this.getAll("pendingSync")
  }

  async removePendingSync(id: number): Promise<void> {
    return this.delete("pendingSync", id.toString())
  }
}

export const offlineStorage = new OfflineStorage()

// Network status utilities
export class NetworkManager {
  private static instance: NetworkManager
  private isOnline: boolean = navigator.onLine
  private listeners: ((online: boolean) => void)[] = []

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager()
    }
    return NetworkManager.instance
  }

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true
        this.notifyListeners()
        this.syncPendingData()
      })

      window.addEventListener("offline", () => {
        this.isOnline = false
        this.notifyListeners()
      })
    }
  }

  getStatus(): boolean {
    return this.isOnline
  }

  addListener(callback: (online: boolean) => void): void {
    this.listeners.push(callback)
  }

  removeListener(callback: (online: boolean) => void): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback)
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.isOnline))
  }

  private async syncPendingData(): Promise<void> {
    if (!this.isOnline) return

    try {
      const pendingItems = await offlineStorage.getPendingSync()

      for (const item of pendingItems) {
        try {
          const response = await fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body,
          })

          if (response.ok) {
            await offlineStorage.removePendingSync(item.id)
          }
        } catch (error) {
          console.error("Failed to sync item:", item.id, error)
        }
      }
    } catch (error) {
      console.error("Failed to sync pending data:", error)
    }
  }

  async queueForSync(data: {
    url: string
    method: string
    headers: Record<string, string>
    body: string
  }): Promise<void> {
    await offlineStorage.addPendingSync({
      ...data,
      timestamp: Date.now(),
    })

    // Register background sync if available
    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("background-sync")
      } catch (error) {
        console.error("Background sync registration failed:", error)
      }
    }
  }
}

export const networkManager = NetworkManager.getInstance()
