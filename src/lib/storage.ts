// lib/storage.ts
'use client';

// Universal storage adapter
class UniversalStorage {
  async getItem(key: string): Promise<string | null> {
    // Client-side: use localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    
    // Server-side: return null or implement server-side storage
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
    // Server-side: no-op or implement server-side storage
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
    // Server-side: no-op
  }
}

export const storage = new UniversalStorage();