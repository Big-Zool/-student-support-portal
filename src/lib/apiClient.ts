import { supabase } from './supabaseClient';
import type { ConversationThread, ConversationMessage } from '../app/components/types';

// Read the backend URL from .env (e.g. http://localhost:8787/api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

/**
 * A helper function that handles all API fetch requests.
 * It automatically grabs the current Supabase session token and attaches it to the request.
 * If the response is not ok, it throws an error.
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('You must be logged in to make this request');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.error || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ==========================================
// API Methods
// ==========================================

export async function getMe() {
  return apiFetch<{ id: string; full_name: string; role: string }>('/me');
}

export async function getConversations() {
  return apiFetch<ConversationThread[]>('/conversations');
}

export async function getConversation(threadId: string) {
  return apiFetch<{ thread: ConversationThread; messages: ConversationMessage[] }>(`/conversations/${threadId}`);
}

export async function createConversation(subject: string, message: string) {
  return apiFetch<ConversationThread>('/conversations', {
    method: 'POST',
    body: JSON.stringify({ subject, message }),
  });
}

export async function updateConversationStatus(threadId: string, status: 'open' | 'pending' | 'closed') {
  return apiFetch<ConversationThread>(`/conversations/${threadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function assignConversation(threadId: string, assignedTo: string | null) {
  return apiFetch<ConversationThread>(`/conversations/${threadId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assignedTo }),
  });
}

export async function sendMessage(threadId: string, body: string) {
  return apiFetch<ConversationMessage>(`/conversations/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export async function getUsers() {
  return apiFetch<{ id: string; full_name: string; role: string; email: string }[]>('/users');
}
