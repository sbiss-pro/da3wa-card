import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type OAuthClientInfo = { name?: string | null; redirect_uri?: string | null } | null | undefined;
type OAuthAuthorizationDetails = {
  client?: OAuthClientInfo;
  redirect_url?: string | null;
  redirect_to?: string | null;
  scope?: string | null;
};

type SupabaseOAuthResult = {
  data: OAuthAuthorizationDetails | null;
  error: { message: string } | null;
};

interface SupabaseOAuthHelpers {
  getAuthorizationDetails(id: string): Promise<SupabaseOAuthResult>;
  approveAuthorization(id: string): Promise<SupabaseOAuthResult>;
  denyAuthorization(id: string): Promise<SupabaseOAuthResult>;
}

function oauthHelpers(): SupabaseOAuthHelpers {
  const authAny = supabase.auth as unknown as { oauth: SupabaseOAuthHelpers };
  return authAny.oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "منح الوصول — INVITLY" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("رابط الترخيص غير صالح");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) {
      throw redirect({ to: "/o/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId =
      new URLSearchParams(location.search).get("authorization_id") ?? "";
    const { data, error } = await oauthHelpers().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      window.location.href = immediate;
      return { redirecting: true, details: null as OAuthAuthorizationDetails | null };
    }
    return { redirecting: false, details: data };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-background px-4">
      <Card className="w-full max-w-md p-6 text-center">
        <h1 className="mb-2 font-display text-xl font-bold">تعذّر تحميل طلب الترخيص</h1>
        <p className="text-sm text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
      </Card>
    </main>
  ),
});

function Consent() {
  const { details, redirecting } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const helpers = oauthHelpers();
    const { data, error: err } = approve
      ? await helpers.approveAuthorization(authorization_id)
      : await helpers.denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("لم يُرجع خادم الترخيص رابط توجيه.");
      return;
    }
    window.location.href = target;
  }

  if (redirecting) {
    return (
      <main dir="rtl" className="grid min-h-screen place-items-center bg-background px-4">
        <Card className="w-full max-w-md p-6 text-center text-sm text-muted-foreground">
          جاري إعادة التوجيه…
        </Card>
      </main>
    );
  }

  const clientName = details?.client?.name ?? "تطبيق خارجي";
  const redirectUri = details?.client?.redirect_uri ?? "";
  const scope = details?.scope ?? "";

  return (
    <main dir="rtl" className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-md p-6">
        <h1 className="font-display text-2xl font-bold">ربط {clientName} بحسابك في INVITLY</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          سيتمكّن <span className="font-semibold">{clientName}</span> من استخدام أدوات INVITLY نيابةً عنك أثناء تسجيل دخولك.
        </p>
        <ul className="mt-4 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
          <li>• الاطلاع على فعالياتك وضيوفك التي تملكها.</li>
          <li>• عرض إحصائيات RSVP والحضور لفعالياتك.</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          لا يتجاوز هذا الربط صلاحياتك في المنصّة أو سياسات الأمان في قاعدة البيانات.
        </p>
        {redirectUri && (
          <p className="mt-2 text-xs text-muted-foreground" dir="ltr">
            Redirect: {redirectUri}
          </p>
        )}
        {scope && (
          <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
            Scope: {scope}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 gold-gradient text-primary-foreground"
          >
            {busy ? "…" : "أوافق"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1"
          >
            رفض
          </Button>
        </div>
      </Card>
    </main>
  );
}
