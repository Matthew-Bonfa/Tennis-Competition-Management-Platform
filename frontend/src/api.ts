// should this be an environment variable?
const baseURL: string = "http://localhost:3000/api"

async function fetchApi(endpoint){
    const response: Response = await fetch(baseURL + endpoint);
    return response.json();
}

export default fetchApi;