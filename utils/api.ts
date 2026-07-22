export async function apiCall(
  method: string,
  endpoint: string,
  body: any,
  options: {
    path?: string;
    headers?: Record<string, string>;
    useAPIKey?: boolean;
  } = {},
) {
  const { path = "discord", headers = {} } = options;

  if (!process.env.API_URL) {
    throw new Error("Missing API_URL environment variable");
  }

  let url = `${process.env.API_URL}/${path}/${endpoint}`;
  let requestBody = body;

  if (
    !headers["Content-Type"] &&
    method.toUpperCase() === "GET" &&
    body != null
  ) {
    url += `?${body}`;
    requestBody = null;
  }

  if (options.useAPIKey) {
    headers["X-API-KEY"] = process.env.APP_TOKEN!;
  }

  if (headers["Content-Type"] === "application/json") {
    requestBody = JSON.stringify(body);
  }

  const params = {
    method: method.toUpperCase(),
    body: requestBody,
    headers,
  };

  const response = await fetch(url, params);

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "<unable to read response>");
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response;
}
