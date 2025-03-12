import { useMemo } from "react";

export function useApi() {
  // Get the base URL from the environment variable
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";

  // Memoize the returned object to avoid recreating it on every render
  const api = useMemo(() => {
    // Function to call the API
    const callApi = async (endpoint: string, options?: RequestInit) => {
      const url = `${baseUrl}${endpoint}`;
      const res = await fetch(url, options);
      if (!res.ok) {
        // If the response is not ok, try to extract an error message
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || "API request failed"
        );
      }
      return res.json();
    };

    return { callApi };
  }, [baseUrl]);

  return api;
}
