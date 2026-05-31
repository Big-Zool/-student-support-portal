import { supabase } from './supabaseClient';
import type { ConversationStatus, Role } from '../app/components/types';

export type ApiProfile = {
  id: string;
  full_name: string;
  role: Role;
};

export type ApiPerson = {
  id: string;
  full_name: string;
};

export type ApiConversationThread = {
  id: string;
  subject: string;
  status: ConversationStatus;
  student_id?: string;
  assigned_to?: string | null;
  last_message_at: string;
  created_at: string;
  student?: ApiPerson | null;
  assigned?: ApiPerson | null;
};

export type ApiMessage = {
  id: string;
  body: string;
  created_at: string;
  sender_type: 'student' | 'team';
  sender?: (ApiPerson & { role?: Role }) | null;
};

export type ApiConversationDetail = {
  thread: ApiConversationThread;
  messages: ApiMessage[];
};

export type ConversationFilters = {
  status?: ConversationStatus | 'all';
  assignedTo?: string | 'me' | 'unassigned' | 'all';
  q?: string;
};

// Read the backend URL from .env (e.g. http://localhost:8787/api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';
const API_TIMEOUT_MS = 15_000;

function buildQueryString(filters?: ConversationFilters) {
  if (!filters) return '';

  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.assignedTo && filters.assignedTo !== 'all') params.set('assignedTo', filters.assignedTo);
  if (filters.q?.trim()) params.set('q', filters.q.trim());

  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * A helper function that handles all API fetch requests.
 * It automatically grabs the current Supabase session token and attaches it to the request.
 * If the response is not ok, it throws an error.
 */
function apiUnreachableMessage(): string {
  return `Cannot reach the API at ${API_BASE_URL}. For local dev, run: cd worker && npm run dev`;
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be logged in to make this request');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const detail = errData?.error || `API Error: ${response.status} ${response.statusText}`;
      if (response.status >= 500) {
        throw new Error(`${detail}. Check that the Worker is running and configured.`);
      }
      throw new Error(detail);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${API_TIMEOUT_MS / 1000}s. ${apiUnreachableMessage()}`);
    }
    if (error instanceof TypeError) {
      throw new Error(apiUnreachableMessage());
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==========================================
// API Methods
// ==========================================

export async function getMe() {
  return apiFetch<ApiProfile>('/me');
}

export async function getConversations(filters?: ConversationFilters) {
  return apiFetch<ApiConversationThread[]>(`/conversations${buildQueryString(filters)}`);
}

export async function getConversation(threadId: string) {
  return apiFetch<ApiConversationDetail>(`/conversations/${threadId}`);
}

export async function createConversation(subject: string, message: string) {
  return apiFetch<ApiConversationThread>('/conversations', {
    method: 'POST',
    body: JSON.stringify({ subject, message }),
  });
}

export async function updateConversationStatus(threadId: string, status: 'open' | 'pending' | 'closed') {
  return apiFetch<ApiConversationThread>(`/conversations/${threadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function assignConversation(threadId: string, assignedTo: string | null) {
  return apiFetch<ApiConversationThread>(`/conversations/${threadId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedTo }),
  });
}

export async function sendMessage(threadId: string, body: string) {
  return apiFetch<ApiMessage>(`/conversations/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function getUsers() {
  return apiFetch<ApiProfile[]>('/users/team');
}
