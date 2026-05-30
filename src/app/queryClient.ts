import { QueryClient } from '@tanstack/react-query';

// Configure a global Query Client.
// This holds all our cached data and defines global behavior (like refetching on window focus)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Auto-refreshes data when user tabs back to the app
      staleTime: 1000 * 60 * 5, // Data is considered "fresh" for 5 minutes
      retry: 1, // Only retry failed requests once before giving up
    },
  },
});
