import type { Race, ClubConfig } from './types';

class DatabaseManager {
  private dbName = 'bushrun-race-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('Failed to open database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('Upgrading database...');
        
        // Create races store if it doesn't exist
        if (!db.objectStoreNames.contains('races')) {
          const racesStore = db.createObjectStore('races', { keyPath: 'id' });
          racesStore.createIndex('date', 'date', { unique: false });
          racesStore.createIndex('status', 'status', { unique: false });
          console.log('Created races object store');
        }
        
        // Create settings store if it doesn't exist
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
          console.log('Created settings object store');
        }
      };
    });
  }

  private ensureDatabase(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
  }

  // Race operations
  async saveRace(race: Race): Promise<void> {
    this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['races'], 'readwrite');
      const store = transaction.objectStore('races');
      
      const request = store.put(race);
      
      request.onsuccess = () => {
        console.log('Race saved successfully:', race.id);
        resolve();
      };
      
      request.onerror = () => {
        console.error('Failed to save race:', request.error);
        reject(request.error);
      };
    });
  }

  async getRace(id: string): Promise<Race | null> {
    this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['races'], 'readonly');
      const store = transaction.objectStore('races');
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        console.error('Failed to get race:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllRaces(): Promise<Race[]> {
    this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['races'], 'readonly');
      const store = transaction.objectStore('races');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Failed to get races:', request.error);
        reject(request.error);
      };
    });
  }

  async getRacesByStatus(status: Race['status']): Promise<Race[]> {
    this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['races'], 'readonly');
      const store = transaction.objectStore('races');
      const index = store.index('status');
      
      const request = index.getAll(status);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Failed to get races by status:', request.error);
        reject(request.error);
      };
    });
  }

  async getCurrentRace(): Promise<Race | null> {
    // Priority order: active -> checkin -> setup -> finished (most recent)
    const statusPriority: Race['status'][] = ['active', 'checkin', 'setup', 'finished'];
    
    for (const status of statusPriority) {
      const races = await this.getRacesByStatus(status);
      if (races.length > 0) {
        // Sort by date descending to get the most recent race
        const sortedRaces = races.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sortedRaces[0];
      }
    }
    
    return null;
  }

  async deleteRace(id: string): Promise<void> {
    this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['races'], 'readwrite');
      const store = transaction.objectStore('races');
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('Race deleted successfully:', id);
        resolve();
      };
      
      request.onerror = () => {
        console.error('Failed to delete race:', request.error);
        reject(request.error);
      };
    });
  }

  // Club configuration operations
  async saveClubConfig(config: ClubConfig): Promise<void> {
    this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const request = store.put({ key: 'club_config', ...config });
      
      request.onsuccess = () => {
        console.log('Club config saved successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('Failed to save club config:', request.error);
        reject(request.error);
      };
    });
  }

  async getClubConfig(): Promise<ClubConfig> {
    this.ensureDatabase();
    
    const defaultConfig: ClubConfig = {
      name: "Berowra Bushrunners",
      primary_color: "#3b82f6", // blue-600
      secondary_color: "#1f2937" // gray-800
    };
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      
      const request = store.get('club_config');
      
      request.onsuccess = () => {
        if (request.result) {
          const { key, ...config } = request.result;
          void key; // Silence unused warning
          resolve(config as ClubConfig);
        } else {
          resolve(defaultConfig);
        }
      };
      
      request.onerror = () => {
        console.error('Failed to get club config:', request.error);
        // Return default config on error
        resolve(defaultConfig);
      };
    });
  }

  // Data validation and repair
  async validateAndRepairData(): Promise<void> {
    this.ensureDatabase();
    
    try {
      // Get all races and validate them
      const races = await this.getAllRaces();
      
      for (const race of races) {
        let needsUpdate = false;
        
        // Validate race structure and fix common issues
        if (!race.id || !race.date || !race.status) {
          console.warn('Invalid race found, removing:', race.id);
          await this.deleteRace(race.id);
          continue;
        }
        
        // Ensure runners array exists
        if (!Array.isArray(race.runners)) {
          race.runners = [];
          needsUpdate = true;
        }
        
        // Validate runner data
        race.runners.forEach(runner => {
          if (typeof runner.checked_in !== 'boolean') {
            runner.checked_in = false;
            needsUpdate = true;
          }
          if (runner.finish_time && typeof runner.finish_time !== 'number') {
            delete runner.finish_time;
            needsUpdate = true;
          }
        });
        
        // Update if needed
        if (needsUpdate) {
          console.log('Repairing race data:', race.id);
          await this.saveRace(race);
        }
      }
      
      console.log('Data validation and repair completed');
    } catch (error) {
      console.error('Failed to validate/repair data:', error);
    }
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['races', 'settings'], 'readwrite');
      
      let completedStores = 0;
      const totalStores = 2;
      
      const onStoreCleared = () => {
        completedStores++;
        if (completedStores === totalStores) {
          console.log('All data cleared successfully');
          resolve();
        }
      };
      
      const racesStore = transaction.objectStore('races');
      const racesRequest = racesStore.clear();
      
      racesRequest.onsuccess = onStoreCleared;
      racesRequest.onerror = () => {
        console.error('Failed to clear races:', racesRequest.error);
        reject(racesRequest.error);
      };
      
      const settingsStore = transaction.objectStore('settings');
      const settingsRequest = settingsStore.clear();
      
      settingsRequest.onsuccess = onStoreCleared;
      settingsRequest.onerror = () => {
        console.error('Failed to clear settings:', settingsRequest.error);
        reject(settingsRequest.error);
      };
    });
  }

  async getStorageInfo(): Promise<{ races: number; settings: number }> {
    this.ensureDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['races', 'settings'], 'readonly');
      const info = { races: 0, settings: 0 };
      let completedStores = 0;
      
      const onStoreCounted = () => {
        completedStores++;
        if (completedStores === 2) {
          resolve(info);
        }
      };
      
      const racesStore = transaction.objectStore('races');
      const racesRequest = racesStore.count();
      
      racesRequest.onsuccess = () => {
        info.races = racesRequest.result;
        onStoreCounted();
      };
      
      racesRequest.onerror = () => reject(racesRequest.error);
      
      const settingsStore = transaction.objectStore('settings');
      const settingsRequest = settingsStore.count();
      
      settingsRequest.onsuccess = () => {
        info.settings = settingsRequest.result;
        onStoreCounted();
      };
      
      settingsRequest.onerror = () => reject(settingsRequest.error);
    });
  }
}

// Create singleton instance
export const db = new DatabaseManager();

// Initialize database when module loads
let initPromise: Promise<void> | null = null;

export const initializeDatabase = (): Promise<void> => {
  if (!initPromise) {
    initPromise = db.init();
  }
  return initPromise;
};