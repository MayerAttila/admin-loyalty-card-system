import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import LoginClient from "./LoginClient";

type LoginPageProps = {
  searchParams?: Promise<{
    switch?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const forceSwitch = params?.switch === "1";
  const session = await getAdminSession();
  if (session?.user && !forceSwitch) {
    redirect("/referrals");
  }

  return <LoginClient forceSwitch={forceSwitch} />;
}
