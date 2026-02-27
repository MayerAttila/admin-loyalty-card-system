import { api } from "./axios";

export type AdminBusinessRecord = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  referral: {
    id: string;
    code: string;
    status: "ACTIVE" | "INACTIVE";
  } | null;
  subscription: {
    id: string | null;
    status: string;
    interval: string | null;
    stripePriceId: string | null;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
    updatedAt: string | null;
  };
};

export const getAdminBusinesses = async () => {
  const res = await api.get<AdminBusinessRecord[]>("/admin/businesses");
  return res.data ?? [];
};

