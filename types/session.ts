export type AppSession = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  expires?: string;
} | null;

