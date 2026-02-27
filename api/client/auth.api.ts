import { api } from "./axios";
import type { AppSession } from "@/types/session";

type SignInPayload = {
  email: string;
  password: string;
  callbackUrl?: string;
};

type SignInResponse = {
  error?: string | null;
  ok?: boolean;
  status?: number;
  url?: string | null;
};

type CsrfResponse = {
  csrfToken: string;
};

type SignOutResponse = {
  url?: string | null;
};

const getAuthErrorFromCallbackUrl = (url?: string | null) => {
  if (!url) return null;

  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(url, base);
    return parsed.searchParams.get("error")?.trim() || null;
  } catch {
    return null;
  }
};

const getCsrfToken = async () => {
  const res = await api.get<CsrfResponse>("/auth/csrf");
  if (!res.data?.csrfToken) {
    throw new Error("Missing CSRF token");
  }
  return res.data.csrfToken;
};

export const signIn = async (payload: SignInPayload) => {
  const csrfToken = await getCsrfToken();
  const body = new URLSearchParams({
    csrfToken,
    email: payload.email,
    password: payload.password,
    callbackUrl:
      typeof window !== "undefined"
        ? payload.callbackUrl ?? `${window.location.origin}/referrals`
        : payload.callbackUrl ?? "/referrals",
    json: "true",
  });

  const res = await api.post("/auth/callback/credentials", body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
      Accept: "application/json",
    },
  });

  const result = res.data as SignInResponse;
  const callbackError = getAuthErrorFromCallbackUrl(result?.url);

  if (result?.error) throw new Error(result.error);
  if (callbackError) throw new Error(callbackError);

  return result;
};

export const getSession = async () => {
  const res = await api.get<AppSession>("/auth/session");
  return res.data ?? null;
};

export const signOut = async () => {
  const csrfToken = await getCsrfToken();
  const body = new URLSearchParams({
    csrfToken,
    callbackUrl: typeof window !== "undefined" ? `${window.location.origin}/login` : "/login",
    json: "true",
  });

  const res = await api.post("/auth/signout", body.toString(), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
      Accept: "application/json",
    },
  });

  return res.data as SignOutResponse;
};
