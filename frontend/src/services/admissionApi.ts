
import type { SchoolClass, AdmissionHold } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  studentId?: string
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (studentId) {
    headers.set("X-Student-Id", studentId);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const admissionApi = {
  getClasses: () =>
    request<SchoolClass[]>("/classes"),

  getMyHolds: (studentId: string) =>
    request<AdmissionHold[]>("/me/holds", {}, studentId),

  createHold: (classId: string, studentId: string) =>
    request<AdmissionHold>(
      `/classes/${classId}/holds`,
      { method: "POST" },
      studentId
    ),

  getHold: (holdId: string) =>
    request<AdmissionHold>(`/holds/${holdId}`),

  confirmHold: (holdId: string, studentId: string) =>
    request<AdmissionHold>(
      `/holds/${holdId}/confirm`,
      { method: "POST" },
      studentId
    ),

  cancelHold: (holdId: string, studentId: string) =>
    request<void>(
      `/holds/${holdId}`,
      { method: "DELETE" },
      studentId
    ),
};
