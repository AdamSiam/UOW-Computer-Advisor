/**
 * Helper to safely fetch JSON from an endpoint.
 * Handles non-OK status codes, empty responses, and non-JSON HTML error pages gracefully.
 */
export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      let errorMsg = `Server error (${res.status})`;
      if (contentType.includes('application/json')) {
        try {
          const errBody = await res.json();
          errorMsg = errBody.message || errBody.error || errorMsg;
        } catch {
          // ignore
        }
      }
      return { ok: false, status: res.status, data: null, error: errorMsg };
    }

    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: true, status: res.status, data };
    }

    // Attempt text parse if JSON header is missing but JSON format is present
    const text = await res.text();
    if (!text.trim()) {
      return { ok: true, status: res.status, data: null };
    }
    try {
      const data = JSON.parse(text);
      return { ok: true, status: res.status, data };
    } catch {
      return { ok: false, status: res.status, data: null, error: 'Received invalid non-JSON response from server.' };
    }
  } catch (err: any) {
    return { ok: false, status: 0, data: null, error: err.message || 'Network request failed.' };
  }
}
