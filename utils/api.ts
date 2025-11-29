export async function apiCall(
  method: string,
  endpoint: string,
  body: any,
  options: {
    path?: string;
    headers?: Record<string, string>;
    useAPIKey?: boolean;
  } = {}
) {
  const { path = "discord", headers = {} } = options;

  let url = `${process.env.API_URL}/${path}/${endpoint}`;
  let requestBody = body;

  if (!headers["Content-Type"] && method.toUpperCase() === "GET") {
    url += `?${body}`;
    requestBody = null;
  }

  if (options.useAPIKey) {
    headers["X-API-KEY"] = process.env.APP_TOKEN!;
  }

  if (headers["Content-Type"] == "application/json") {
    requestBody = JSON.stringify(body);
  }

  const params = {
    method: method.toUpperCase(),
    body: requestBody,
    headers,
  };

  return await fetch(url, params);
}
