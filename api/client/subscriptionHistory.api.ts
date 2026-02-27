import { api } from "./axios";

export type AdminSubscriptionHistoryItem = {
  id: string;
  business: {
    id: string;
    name: string;
  };
  source: string;
  eventType: string | null;
  stripeSubscriptionId: string | null;
  previousStatus: string | null;
  nextStatus: string | null;
  previousPriceId: string | null;
  nextPriceId: string | null;
  previousInterval: string | null;
  nextInterval: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean | null;
  createdAt: string;
};

export type AdminSubscriptionHistoryResponse = {
  items: AdminSubscriptionHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
};

type ListSubscriptionHistoryParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  businessId?: string;
};

export const getAdminSubscriptionHistory = async (
  params: ListSubscriptionHistoryParams = {}
) => {
  const query = new URLSearchParams();
  if (typeof params.page === "number") query.set("page", String(params.page));
  if (typeof params.pageSize === "number") {
    query.set("pageSize", String(params.pageSize));
  }
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.businessId?.trim()) query.set("businessId", params.businessId.trim());

  const path = query.toString()
    ? `/admin/businesses/subscription-history?${query.toString()}`
    : "/admin/businesses/subscription-history";

  const res = await api.get<AdminSubscriptionHistoryResponse>(path);
  return (
    res.data ?? {
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    }
  );
};
