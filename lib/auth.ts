import { cookies } from "next/headers";

type AdminSession = {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
  };
  expires?: string;
} | null;

const normalizeApiBaseUrl = (value: string | undefined) =>
  (value ?? "").trim().replace(/\/+$/, "");

export const getAdminSession = async (): Promise<AdminSession> => {
  const apiBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (!apiBaseUrl) return null;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(`${apiBaseUrl}/auth/session`, {
      method: "GET",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AdminSession;
    return data ?? null;
  } catch {
    return null;
  }
};

