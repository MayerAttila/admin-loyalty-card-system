import { api } from "./axios";

export type ReferralLinkStatus = "ACTIVE" | "INACTIVE";

export type ReferralLinkRecord = {
  id: string;
  code: string;
  status: ReferralLinkStatus;
  landingPath: string;
  createdAt: string;
  updatedAt: string;
};

export const getReferralLinks = async () => {
  const { data } = await api.get<ReferralLinkRecord[]>("/referral-link");
  return data;
};

export const createReferralLink = async (payload: {
  code: string;
  status?: ReferralLinkStatus;
  landingPath?: string;
}) => {
  const { data } = await api.post<ReferralLinkRecord>("/referral-link", payload);
  return data;
};

export const updateReferralLink = async (
  id: string,
  payload: Partial<Pick<ReferralLinkRecord, "code" | "status" | "landingPath">>
) => {
  const { data } = await api.patch<ReferralLinkRecord>(
    `/referral-link/id/${encodeURIComponent(id)}`,
    payload
  );
  return data;
};

export const deleteReferralLink = async (id: string) => {
  await api.delete(`/referral-link/id/${encodeURIComponent(id)}`);
};

