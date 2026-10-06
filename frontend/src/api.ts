export const baseURL: string = "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

// Updated to now include jwt token if applicable
async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Init headers from the options
  const headers = new Headers(options.headers);

  // Inject JWT token if it exists in storage
  const token = localStorage.getItem("access_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Execute the fetch request
  const response: Response = await fetch(baseURL + endpoint, {
    ...options,
    headers,
  });

  // Global Auth Handling: Kick user to login if token is expired/invalid
  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("personId");
    localStorage.removeItem("roles");
    window.location.href = "/login";
    throw new ApiError(401, { message: "Session expired" });
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // error response had no JSON body — leave body as null
    }
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export default fetchApi;

export async function postApi(
  endpoint: string,
  data: unknown,
  options: RequestInit = {},
) {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  return fetchApi(endpoint, {
    ...options,
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function patchApi(
  endpoint: string,
  data: unknown,
  options: RequestInit = {},
) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  return fetchApi(endpoint, {
    ...options,
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
}

