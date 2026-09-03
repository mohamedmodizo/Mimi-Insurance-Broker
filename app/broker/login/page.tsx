import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser, userCanAccessBrokerArea } from "@/lib/security";

export default async function BrokerLoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const user = await getCurrentUser();
  if (user && userCanAccessBrokerArea(user.role)) redirect("/broker");
  const { returnTo } = await searchParams;
  const safeReturnHref = returnTo?.startsWith("/access/") ? returnTo : undefined;

  return (
    <main className="auth-screen">
      <LoginForm
        demoEmail={process.env.BROKER_DEMO_EMAIL ?? "broker@example.com"}
        allowDemoLogin={process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_LOGIN === "true"}
        allowDemoMfa={process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_MFA_HELPER === "true"}
        returnHref={safeReturnHref}
      />
    </main>
  );
}
