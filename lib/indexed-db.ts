import type { Model } from "./models-data"

const DB_NAME = "ai-models-db"
const DB_VERSION = 1
const MODELS_STORE = "models"
const META_STORE = "meta"

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Models store with indexes for fast filtering/sorting
      if (!db.objectStoreNames.contains(MODELS_STORE)) {
        const modelsStore = db.createObjectStore(MODELS_STORE, { keyPath: "id" })
        modelsStore.createIndex("provider", "litellm_provider", { unique: false })
        modelsStore.createIndex("mode", "mode", { unique: false })
        modelsStore.createIndex("inputCost", "input_cost_per_token", { unique: false })
        modelsStore.createIndex("outputCost", "output_cost_per_token", { unique: false })
        modelsStore.createIndex("context", "max_input_tokens", { unique: false })
        modelsStore.createIndex("vision", "supports_vision", { unique: false })
        modelsStore.createIndex("audio", "supports_audio_input", { unique: false })
        modelsStore.createIndex("functionCalling", "supports_function_calling", { unique: false })
        modelsStore.createIndex("reasoning", "supports_reasoning", { unique: false })
      }

      // Meta store for tracking last update time and data hash
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" })
      }
    }
  })

  return dbPromise
}

export async function getCachedModels(): Promise<{
  models: Model[]
  lastUpdated: number | null
  dataHash: string | null
}> {
  try {
    const db = await openDB()

    // Get meta info
    const metaTx = db.transaction(META_STORE, "readonly")
    const metaStore = metaTx.objectStore(META_STORE)

    const lastUpdatedReq = metaStore.get("lastUpdated")
    const dataHashReq = metaStore.get("dataHash")

    const [lastUpdatedResult, dataHashResult] = await Promise.all([
      new Promise<any>((resolve) => {
        lastUpdatedReq.onsuccess = () => resolve(lastUpdatedReq.result)
        lastUpdatedReq.onerror = () => resolve(null)
      }),
      new Promise<any>((resolve) => {
        dataHashReq.onsuccess = () => resolve(dataHashReq.result)
        dataHashReq.onerror = () => resolve(null)
      }),
    ])

    // Get all models
    const modelsTx = db.transaction(MODELS_STORE, "readonly")
    const modelsStore = modelsTx.objectStore(MODELS_STORE)
    const modelsReq = modelsStore.getAll()

    const models = await new Promise<Model[]>((resolve, reject) => {
      modelsReq.onsuccess = () => resolve(modelsReq.result || [])
      modelsReq.onerror = () => reject(modelsReq.error)
    })

    return {
      models,
      lastUpdated: lastUpdatedResult?.value || null,
      dataHash: dataHashResult?.value || null,
    }
  } catch (error) {
    console.error("[App] IndexedDB getCachedModels error:", error)
    return { models: [], lastUpdated: null, dataHash: null }
  }
}

export async function cacheModels(models: Model[], dataHash: string): Promise<void> {
  try {
    const db = await openDB()

    // Clear and re-populate models store
    const modelsTx = db.transaction(MODELS_STORE, "readwrite")
    const modelsStore = modelsTx.objectStore(MODELS_STORE)
    modelsStore.clear()

    for (const model of models) {
      modelsStore.put(model)
    }

    await new Promise<void>((resolve, reject) => {
      modelsTx.oncomplete = () => resolve()
      modelsTx.onerror = () => reject(modelsTx.error)
    })

    // Update meta
    const metaTx = db.transaction(META_STORE, "readwrite")
    const metaStore = metaTx.objectStore(META_STORE)
    metaStore.put({ key: "lastUpdated", value: Date.now() })
    metaStore.put({ key: "dataHash", value: dataHash })

    await new Promise<void>((resolve, reject) => {
      metaTx.oncomplete = () => resolve()
      metaTx.onerror = () => reject(metaTx.error)
    })

    console.log("[App] Cached", models.length, "models to IndexedDB")
  } catch (error) {
    console.error("[App] IndexedDB cacheModels error:", error)
  }
}

// Fast filtered query using indexes
export async function queryModelsByIndex(indexName: string, value: IDBValidKey | IDBKeyRange): Promise<Model[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(MODELS_STORE, "readonly")
    const store = tx.objectStore(MODELS_STORE)
    const index = store.index(indexName)
    const request = index.getAll(value)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("[App] IndexedDB query error:", error)
    return []
  }
}

// Generate a simple hash of the data for change detection
export function generateDataHash(data: any): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

// Clear the database
export async function clearCache(): Promise<void> {
  try {
    const db = await openDB()
    const modelsTx = db.transaction(MODELS_STORE, "readwrite")
    modelsTx.objectStore(MODELS_STORE).clear()

    const metaTx = db.transaction(META_STORE, "readwrite")
    metaTx.objectStore(META_STORE).clear()

    console.log("[App] IndexedDB cache cleared")
  } catch (error) {
    console.error("[App] IndexedDB clear error:", error)
  }
}
