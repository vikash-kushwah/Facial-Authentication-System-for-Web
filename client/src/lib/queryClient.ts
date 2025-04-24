import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | { url?: string; method?: string; headers?: Record<string, string>; body?: any },
  options?: { method?: string; headers?: Record<string, string>; body?: any },
  data?: unknown | undefined,
): Promise<any> {
  let url: string;
  let fetchOptions: RequestInit = {
    credentials: "include",
    headers: {}
  };
  
  // Handle different function signatures
  if (typeof urlOrOptions === 'string') {
    // apiRequest(url, options?, data?)
    url = urlOrOptions;
    
    if (options) {
      fetchOptions = {
        ...fetchOptions,
        ...options,
        headers: {
          ...fetchOptions.headers,
          ...(options.headers || {})
        }
      };
    }
    
    if (data) {
      fetchOptions.body = JSON.stringify(data);
      (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
    }
  } else {
    // apiRequest(options)
    if (!urlOrOptions.url) {
      throw new Error('URL is required when using object parameter');
    }
    
    url = urlOrOptions.url;
    fetchOptions = {
      ...fetchOptions,
      method: urlOrOptions.method || 'GET',
      headers: {
        ...fetchOptions.headers,
        ...(urlOrOptions.headers || {})
      }
    };
    
    if (urlOrOptions.body) {
      fetchOptions.body = 
        typeof urlOrOptions.body === 'string' 
          ? urlOrOptions.body 
          : JSON.stringify(urlOrOptions.body);
      
      if (typeof urlOrOptions.body !== 'string' && !(urlOrOptions.headers && urlOrOptions.headers["Content-Type"])) {
        (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
      }
    }
  }

  const res = await fetch(url, fetchOptions);
  await throwIfResNotOk(res);
  
  // Try to parse as JSON first, if that fails return the response object
  try {
    return await res.json();
  } catch (e) {
    return res;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
