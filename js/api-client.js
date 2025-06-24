// API Client for MusicGen Backend (Vercel Functions)
class APIClient {
  constructor() {
    // For Vercel, API routes are at /api
    this.baseURL = '/api';
    this.token = localStorage.getItem('musicgen_token');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    localStorage.setItem('musicgen_token', token);
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('musicgen_token');
  }

  // Make authenticated request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication
  async login(accessToken) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ accessToken })
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async followUser(userId) {
    return this.request(`/auth/follow/${userId}`, {
      method: 'POST'
    });
  }

  // Songs
  async createSong(data) {
    return this.request('/songs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSong(songId) {
    return this.request(`/songs/${songId}`);
  }

  async updateSong(songId, data) {
    return this.request(`/songs/${songId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteSong(songId) {
    return this.request(`/songs/${songId}`, {
      method: 'DELETE'
    });
  }

  async getMySongs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/songs${query ? `?${query}` : ''}`);
  }

  async likeSong(songId) {
    return this.request(`/songs/${songId}/like`, {
      method: 'POST'
    });
  }

  async shareSong(songId) {
    return this.request(`/songs/${songId}/share`, {
      method: 'POST'
    });
  }

  // Credits
  async getCredits() {
    return this.request('/credits');
  }

  async purchaseCredits(packageId) {
    return this.request('/credits/buy', {
      method: 'POST',
      body: JSON.stringify({ packageId })
    });
  }

  async subscribe(tier) {
    return this.request('/credits/subscribe', {
      method: 'POST',
      body: JSON.stringify({ tier })
    });
  }

  async cancelSubscription() {
    return this.request('/credits/cancel-subscription', {
      method: 'POST'
    });
  }

  // Explore
  async exploreSongs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/explore${query ? `?${query}` : ''}`);
  }

  async getGenres() {
    return this.request('/explore/genres');
  }

  async getTags() {
    return this.request('/explore/tags');
  }

  async getUserProfile(username) {
    return this.request(`/explore/users/${username}`);
  }

  async getSharedSong(shareCode) {
    return this.request(`/explore/share/${shareCode}`);
  }

  // Poll for song completion
  async pollSongStatus(songId, onProgress) {
    const maxAttempts = 60;
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        throw new Error('Song generation timeout');
      }
      
      const song = await this.getSong(songId);
      
      if (onProgress) {
        const progress = song.song.status === 'processing' ? 50 : 
                        song.song.status === 'completed' ? 100 : 25;
        onProgress(progress, song.song.status);
      }
      
      if (song.song.status === 'completed') {
        return song;
      }
      
      if (song.song.status === 'failed') {
        throw new Error(song.song.error?.message || 'Generation failed');
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return poll();
    };
    
    return poll();
  }
}

// Create global instance
window.apiClient = new APIClient();

// Export for module usage
export default APIClient;