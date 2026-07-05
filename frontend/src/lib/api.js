const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isLocalhost =
  typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

const API_BASE_URL = configuredBaseUrl || (isLocalhost ? "http://localhost:8000" : "https://escape-finder-backend.onrender.com");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail = payload?.detail || `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return response.json();
}

export function fetchQuestions() {
  return request("/api/questions");
}

export function filterCountries(answeredQuestions) {
  return request("/api/filter", {
    method: "POST",
    body: JSON.stringify({ answered_questions: answeredQuestions }),
  });
}
