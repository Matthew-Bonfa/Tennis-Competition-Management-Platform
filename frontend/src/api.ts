// should this be an environment variable?
const baseURL: string = "http://localhost:3000/api"

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(status: number, body: unknown) {
        super(`Request failed with status ${status}`);
        this.status = status;
        this.body = body;
    }
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const response: Response = await fetch(baseURL + endpoint, options);

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


export async function postApi(endpoint: string, data: unknown, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    
    headers.set('Content-Type', 'application/json');

    return fetchApi(endpoint, {
        ...options,
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
}