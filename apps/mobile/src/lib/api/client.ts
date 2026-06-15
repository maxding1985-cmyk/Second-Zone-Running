import type {
  AnonymousUser,
  CoachStyle,
  PostRunFeedback,
  RunEventType,
  RunExitReason,
  RunFeedbackType,
  RunMode,
  RunReport,
  RunSession,
  SessionStatus
} from "@run-chat/shared";

const DEFAULT_API_URL = "http://127.0.0.1:4000";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

type ApiOptions = {
  timeoutMs?: number;
};

async function request<T>(path: string, init?: RequestInit, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${await response.text()}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function createAnonymousUser(input: { nickname?: string; testerGroup?: string } = {}) {
  return request<AnonymousUser>("/api/users/anonymous", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function createRunSession(input: { mode: RunMode; coachStyle: CoachStyle; userId?: string }) {
  return request<RunSession>("/api/sessions", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateRunSession(
  sessionId: string,
  input: { status?: SessionStatus; durationSec?: number; exitReason?: RunExitReason }
) {
  return request<RunSession>(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function recordRunEvent(
  sessionId: string,
  input: { type: RunEventType; payload?: Record<string, unknown> }
) {
  return request(`/api/sessions/${sessionId}/events`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function recordRunFeedback(sessionId: string, feedback: RunFeedbackType, elapsedSec: number) {
  return recordRunEvent(sessionId, {
    type: "feedback",
    payload: { feedback, elapsedSec }
  });
}

export function getRunReport(sessionId: string) {
  return request<RunReport>(`/api/sessions/${sessionId}/report`);
}

export function submitPostRunFeedback(sessionId: string, feedback: PostRunFeedback) {
  return request<PostRunFeedback>(`/api/sessions/${sessionId}/feedback`, {
    method: "POST",
    body: JSON.stringify(feedback)
  });
}

export function getAdminMetrics() {
  return request<Record<string, unknown>>("/api/admin/metrics");
}

export function getAdminSessions() {
  return request<{ sessions: Array<Record<string, unknown>> }>("/api/admin/sessions");
}
