import * as SecureStore from 'expo-secure-store';

// IMPORTANT: Change this to your computer's IP address for physical devices
// For iOS simulator: use localhost
// For Android emulator: use 10.0.2.2
// For physical device: use your computer's IP (e.g., 192.168.104.235)
export const API_URL = 'http://10.11.2.10:3000';

const TOKEN_KEY = 'auth_token';

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

async function makeRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export interface CollectionItem {
  id: string;
  userId: string;
  type: 'itemized' | 'bulk';
  title?: string;
  metal: 'gold' | 'silver' | 'platinum';
  quantity: number;
  weightOz: number;
  grade?: string;
  gradingService?: string;
  notes?: string;
  images?: string[];
  bookValueType: 'custom' | 'spot';
  customBookValue?: number;
  spotPriceAtCreation: number;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  // Collection Items
  async getCollectionItems(): Promise<CollectionItem[]> {
    const response = await makeRequest('/api/collection');

    if (!response.ok) {
      throw new Error('Failed to fetch collection items');
    }

    const data = await response.json();

    // Transform API response to match mobile app format
    return data.data.map((item: any) => ({
      ...item,
      images: item.images?.map((img: any) => img.url) || [],
    }));
  },

  async getCollectionItem(id: string): Promise<CollectionItem> {
    const response = await makeRequest(`/api/collection/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch collection item');
    }

    const data = await response.json();

    return {
      ...data.data,
      images: data.data.images?.map((img: any) => img.url) || [],
    };
  },

  async createCollectionItem(item: Omit<CollectionItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CollectionItem> {
    const response = await makeRequest('/api/collection', {
      method: 'POST',
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create collection item');
    }

    const data = await response.json();

    return {
      ...data.data,
      images: data.data.images?.map((img: any) => img.url) || [],
    };
  },

  async updateCollectionItem(id: string, item: Partial<CollectionItem>): Promise<CollectionItem> {
    const response = await makeRequest(`/api/collection/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update collection item');
    }

    const data = await response.json();

    return {
      ...data.data,
      images: data.data.images?.map((img: any) => img.url) || [],
    };
  },

  async deleteCollectionItem(id: string): Promise<void> {
    const response = await makeRequest(`/api/collection/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete collection item');
    }
  },
};
