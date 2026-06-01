const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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
