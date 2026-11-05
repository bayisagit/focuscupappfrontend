/**
 * AASTU Focus Football Cup - API Client
 * Centralized client for communication with Django REST Framework backend.
 */

import { apiCache, DEFAULT_STALE_TIME, DEFAULT_CACHE_TIME } from './cache';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8002';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setAuthTokens(access: string, refresh?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

export function clearAuthTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_cache');
  apiCache.clear();
}

export interface FetchAPIOptions extends RequestInit {
  forceRefresh?: boolean;
  skipCache?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

async function fetchAPI<T>(endpoint: string, options: FetchAPIOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cacheKey = endpoint;

  // Stale-While-Revalidate Caching for GET requests
  if (isGet && !options.skipCache && !options.forceRefresh) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      // If stale, trigger background revalidation without blocking caller
      if (apiCache.isStale(cacheKey)) {
        apiCache.dedupe(cacheKey, async () => {
          try {
            const fresh = await executeNetworkFetch<T>(endpoint, options);
            apiCache.set(cacheKey, fresh, options.staleTime, options.cacheTime);
            return fresh;
          } catch (err) {
            // Ignore background revalidation network errors; keep stale cache
            return cached;
          }
        }).catch(() => {});
      }
      return cached;
    }
  }

  // Network fetch (with request deduplication for concurrent identical GET requests)
  const fetchPromise = () => executeNetworkFetch<T>(endpoint, options);
  const result = isGet
    ? await apiCache.dedupe(cacheKey, fetchPromise)
    : await fetchPromise();

  // Cache successful GET responses
  if (isGet && !options.skipCache && result !== null && result !== undefined) {
    apiCache.set(cacheKey, result, options.staleTime, options.cacheTime);
  }

  // Invalidate related cache domains on mutating actions
  if (!isGet) {
    if (endpoint.includes('/matches') || endpoint.includes('/fixtures')) {
      apiCache.invalidateMatches();
    } else if (endpoint.includes('/announcements') || endpoint.includes('/notifications')) {
      apiCache.invalidateAnnouncements();
    } else if (endpoint.includes('/gallery')) {
      apiCache.invalidate('/api/v1/community/gallery/');
      apiCache.invalidate('/api/v1/community/gallery/upload/');
    } else if (endpoint.includes('/members') || endpoint.includes('/player')) {
      apiCache.invalidateMembers();
    } else if (endpoint.includes('/settings')) {
      apiCache.invalidate('/settings');
    } else {
      apiCache.invalidate(endpoint.split('?')[0]);
    }
  }

  return result;
}

async function executeNetworkFetch<T>(endpoint: string, options: FetchAPIOptions = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type to JSON if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: res.statusText || 'An unexpected error occurred.' };
      }
      throw { status: res.status, data: errorData };
    }

    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (err: any) {
    if (err.status) throw err;
    throw {
      status: 500,
      data: { error: 'Unable to connect to the tournament server. Please check your connection.' }
    };
  }
}

// API Domains
export const api = {
  // Auth
  auth: {
    login: (credentials: any) => fetchAPI<any>('/api/v1/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
    register: (userData: any) => fetchAPI<any>('/api/v1/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    getMe: () => fetchAPI<any>('/api/v1/auth/me/'),
    resetPassword: (payload: any) => fetchAPI<any>('/api/v1/auth/password-reset/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  },

  // Members
  members: {
    list: (params?: Record<string, string>) => {
      const qs = params ? new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/api/v1/members/${qs ? `?${qs}` : ''}`);
    },
    getOptions: () => fetchAPI<any>('/api/v1/members/options/'),
    getDetail: (identifier: string) => {
      const clean = decodeURIComponent(identifier);
      return fetchAPI<any>(`/api/v1/members/${encodeURIComponent(clean)}/`);
    },
    toggleFollow: (memberId: number) => fetchAPI<any>(`/api/v1/members/${memberId}/follow/`, {
      method: 'POST'
    }),
    getFollowers: (memberId: number) => fetchAPI<any>(`/api/v1/members/${memberId}/followers/`),
    getFollowing: (memberId: number) => fetchAPI<any>(`/api/v1/members/${memberId}/following/`),
    updateProfile: (data: any) => fetchAPI<any>('/api/v1/members/me/update/', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    applyPlayer: (data: any) => fetchAPI<any>('/api/v1/members/apply-player/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getBatchJerseys: (batchCode?: string) => {
      const query = batchCode ? `?batch_code=${encodeURIComponent(batchCode)}` : '';
      return fetchAPI<any>(`/api/v1/members/batch-jerseys/${query}`);
    },
  },

  // Competitions
  competitions: {
    getSeasons: () => fetchAPI<any>('/api/v1/competitions/seasons/'),
    getActiveSeason: () => fetchAPI<any>('/api/v1/competitions/seasons/active/'),
    getStandings: (seasonId?: number) => {
      const url = seasonId
        ? `/api/v1/competitions/seasons/${seasonId}/standings/`
        : '/api/v1/competitions/standings/';
      return fetchAPI<any>(url);
    },
    getBatches: () => fetchAPI<any>('/api/v1/competitions/batches/'),
    getBatchDetail: (batchCode: string) => fetchAPI<any>(`/api/v1/competitions/batches/${batchCode}/`),
    updateBatch: (batchCode: string, data: any) => fetchAPI<any>(`/api/v1/competitions/batches/${batchCode}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  },

  // Matches
  matches: {
    list: (params?: Record<string, string>) => {
      const qs = params ? new URLSearchParams(params).toString() : '';
      return fetchAPI<any>(`/api/v1/matches/${qs ? `?${qs}` : ''}`);
    },
    getDetail: (id: number | string) => fetchAPI<any>(`/api/v1/matches/${id}/`),
    getLatestAndNext: () => fetchAPI<any>('/api/v1/matches/latest-and-next/'),
    getGraphics: (params?: Record<string, string | number>) => {
      const sp = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
        });
      }
      const qs = sp.toString();
      return fetchAPI<any>(`/api/v1/matches/graphics/${qs ? `?${qs}` : ''}`);
    },
    createGraphic: (data: any) => fetchAPI<any>('/api/v1/matches/graphics/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    deleteGraphic: (id: number | string) => fetchAPI<any>(`/api/v1/matches/graphics/${id}/`, {
      method: 'DELETE',
    }),
  },

  // Statistics
  statistics: {
    getTopScorers: (limit = 10, seasonId?: number) => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (seasonId) params.append('season', seasonId.toString());
      return fetchAPI<any>(`/api/v1/statistics/top-scorers/?${params.toString()}`);
    },
    getTopAssists: (limit = 10, seasonId?: number) => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (seasonId) params.append('season', seasonId.toString());
      return fetchAPI<any>(`/api/v1/statistics/top-assists/?${params.toString()}`);
    },
    getMostFollowed: (limit = 10, batch?: string) => {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (batch) params.append('batch', batch);
      return fetchAPI<any>(`/api/v1/statistics/most-followed/?${params.toString()}`);
    },
    getSummary: (seasonId?: number) => {
      const qs = seasonId ? `?season=${seasonId}` : '';
      return fetchAPI<any>(`/api/v1/statistics/summary/${qs}`);
    },
    getAwards: (seasonId?: number) => {
      const qs = seasonId ? `?season=${seasonId}` : '';
      return fetchAPI<any>(`/api/v1/statistics/awards/${qs}`);
    },
  },

  // Community
  community: {
    getAnnouncements: () => fetchAPI<any>('/api/v1/community/announcements/'),
    createAnnouncement: (data: any) => fetchAPI<any>('/api/v1/community/announcements/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateAnnouncement: (id: number | string, data: any) => fetchAPI<any>(`/api/v1/community/announcements/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    deleteAnnouncement: (id: number | string) => fetchAPI<any>(`/api/v1/community/announcements/${id}/`, {
      method: 'DELETE',
    }),
    getGallery: (options?: FetchAPIOptions) => fetchAPI<any>('/api/v1/community/gallery/', options),
    getUploadQuota: () => fetchAPI<any>('/api/v1/community/gallery/upload/'),
    uploadPhoto: (data: FormData | any) => fetchAPI<any>('/api/v1/community/gallery/upload/', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
    getNotifications: () => fetchAPI<any>('/api/v1/community/notifications/'),
    markNotificationsRead: () => fetchAPI<any>('/api/v1/community/notifications/', {
      method: 'POST'
    }),
  },

  // Settings
  settings: {
    get: () => fetchAPI<any>('/api/v1/settings/'),
    update: (data: any) => fetchAPI<any>('/api/v1/settings/', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  },

  // Manager Portal
  manager: {
    getDashboard: () => fetchAPI<any>('/api/v1/manager/dashboard/'),
    getMembers: (search?: string, batch?: string) => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (batch) params.append('batch', batch);
      return fetchAPI<any>(`/api/v1/manager/members/?${params.toString()}`);
    },
    toggleSuspend: (memberId: number) => fetchAPI<any>(`/api/v1/manager/members/${memberId}/suspend/`, {
      method: 'POST'
    }),
    deleteMember: (memberId: number) => fetchAPI<any>(`/api/v1/manager/members/${memberId}/delete/`, {
      method: 'DELETE'
    }),
    getPlayerRegistrations: (status?: string) => {
      const qs = status ? `?status=${status}` : '';
      return fetchAPI<any>(`/api/v1/manager/player-registrations/${qs}`);
    },
    reviewPlayer: (registrationId: number, status: 'APPROVED' | 'REJECTED', reason?: string) =>
      fetchAPI<any>(`/api/v1/manager/player-registrations/${registrationId}/review/`, {
        method: 'POST',
        body: JSON.stringify({ status, reason })
      }),
    generateFixtures: (seasonId?: number, startDate?: string) => fetchAPI<any>('/api/v1/manager/generate-fixtures/', {
      method: 'POST',
      body: JSON.stringify({ season_id: seasonId, start_date: startDate })
    }),
    createFixture: (data: {
      home_team_id: number | string;
      away_team_id: number | string;
      match_date: string;
      kick_off_time?: string;
      venue?: string;
      round_number?: number | string;
      stage_or_round_name?: string;
      notes?: string;
    }) => fetchAPI<any>('/api/v1/manager/fixtures/create/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateMatch: (matchId: number, data: any) => fetchAPI<any>(`/api/v1/manager/matches/${matchId}/update/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    getMatchSquad: (matchId: number) => fetchAPI<any>(`/api/v1/manager/matches/${matchId}/squad/`),
    saveMatchSquad: (matchId: number, data: { home_squad?: any[]; away_squad?: any[] }) =>
      fetchAPI<any>(`/api/v1/manager/matches/${matchId}/squad/`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    publishMatch: (matchId: number) => fetchAPI<any>(`/api/v1/manager/matches/${matchId}/publish/`, {
      method: 'POST'
    }),
    correctMatch: (matchId: number, homeScore: number, awayScore: number, reason: string) =>
      fetchAPI<any>(`/api/v1/manager/matches/${matchId}/correct/`, {
        method: 'POST',
        body: JSON.stringify({ home_score: homeScore, away_score: awayScore, reason })
      }),
    addMatchEvent: (matchId: number, eventData: any) =>
      fetchAPI<any>(`/api/v1/manager/matches/${matchId}/events/`, {
        method: 'POST',
        body: JSON.stringify(eventData)
      }),
    deleteMatchEvent: (matchId: number, eventId: number) =>
      fetchAPI<any>(`/api/v1/manager/matches/${matchId}/events/`, {
        method: 'DELETE',
        body: JSON.stringify({ event_id: eventId })
      }),
    getAuditLogs: () => fetchAPI<any>('/api/v1/manager/audit-logs/'),
    getExportUrl: (dataType: 'members' | 'rosters' | 'matches' | 'standings') => {
      const token = getAuthToken();
      return `${API_BASE}/api/v1/manager/export/${dataType}/${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    },
    downloadExport: async (dataType: 'members' | 'rosters' | 'matches' | 'standings') => {
      const token = getAuthToken();
      const url = `${API_BASE}/api/v1/manager/export/${dataType}/`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        let msg = `Failed to export ${dataType} (Status ${res.status})`;
        try {
          const data = await res.json();
          msg = data.error || data.detail || msg;
        } catch (_) {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `focus_cup_${dataType}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    },
    getCoaches: () => fetchAPI<any>('/api/v1/manager/coaches/'),
    assignCoach: (data: { batch_code: string; member_id: number; username: string; password: string }) =>
      fetchAPI<any>('/api/v1/manager/coaches/assign/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    revokeCoach: (batch_code: string) =>
      fetchAPI<any>('/api/v1/manager/coaches/revoke/', {
        method: 'POST',
        body: JSON.stringify({ batch_code }),
      }),
  },

  // Dedicated Coach Portal Endpoints
  coach: {
    getDashboard: () => fetchAPI<any>('/api/v1/coach/dashboard/'),
    getPlayers: (status?: string) =>
      fetchAPI<any>(`/api/v1/coach/players/${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    reviewPlayer: (registrationId: number, data: { status: 'APPROVED' | 'REJECTED'; reason?: string; jersey_number?: number }) =>
      fetchAPI<any>(`/api/v1/coach/players/${registrationId}/review/`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMatches: () => fetchAPI<any>('/api/v1/coach/matches/'),
    getMatchSquad: (matchId: number) => fetchAPI<any>(`/api/v1/coach/matches/${matchId}/squad/`),
    saveMatchSquad: (matchId: number, squad: any[]) =>
      fetchAPI<any>(`/api/v1/coach/matches/${matchId}/squad/`, {
        method: 'POST',
        body: JSON.stringify({ squad }),
      }),
  },
};
