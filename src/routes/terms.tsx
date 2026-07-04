import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal-shell";
import { getSiteContent, type SiteContent } from "@/lib/admin.functions";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — INVITLY" },
      { name: "description", content: "الشروط والأحكام المنظمة لاستخدام منصة INVITLY لإدارة الدعوات الإلكترونية." },
      { property: "og:title", content: "الشروط والأحكام — INVITLY" },
      { property: "og:description", content: "الشروط والأحكام المنظمة لاستخدام منصة INVITLY لإدارة الدعوات الإلكترونية." },
      { property: "og:url", content: "https://da3wa-card.lovable.app/terms" },
    ],
    links: [{ rel: "canonical", href: "https://da3wa-card.lovable.app/terms" }],
  }),
  loader: () => getSiteContent(),
  component: TermsPage,
});

function TermsPage() {
  const c = Route.useLoaderData() as SiteContent;
  const p = c.pages.terms;
  return (
    <LegalShell eyebrow={p.eyebrow} title={p.title} subtitle={p.subtitle}>
      <p className="whitespace-pre-line">{p.body}</p>
    </LegalShell>
  );
}

function _Removed() {
  return (
    <LegalShell eyebrow="" title="">
      <h2>١. قبول الشروط</h2>
      <p>
        إن إنشاءك حساباً على منصة INVITLY أو استخدامك لأي من خدماتها يعني
        موافقتك التامة على هذه الشروط والأحكام.
      </p>

      <h2>٢. وصف الخدمة</h2>
      <p>
        تقدم INVITLY منصة رقمية لإنشاء الدعوات الإلكترونية، إدارة قوائم
        المدعوين، إرسال الدعوات، ومتابعة الردود والحضور.
      </p>

      <h2>٣. مسؤوليات المستخدم</h2>
      <ul>
        <li>تقديم بيانات صحيحة عند التسجيل.</li>
        <li>المحافظة على سرية بيانات الدخول وعدم مشاركتها.</li>
        <li>الحصول على إذن مسبق من المدعوين لإضافة بياناتهم.</li>
        <li>عدم استخدام المنصة في إرسال محتوى مزعج أو غير قانوني.</li>
      </ul>

      <h2>٤. الدفع والاسترداد</h2>
      <p>
        تُدفع رسوم الباقات مقدماً وتُفعَّل الخدمة فور تأكيد الدفع. لا يمكن
        استرداد المبلغ بعد بدء إرسال الدعوات للضيوف. للحالات الاستثنائية
        يُرجى التواصل مع فريق الدعم خلال ٤٨ ساعة من الشراء.
      </p>

      <h2>٥. الملكية الفكرية</h2>
      <p>
        كل العناصر التصميمية والبرمجية لمنصة INVITLY مملوكة للمنصة. لا يحق
        نسخها أو إعادة بيعها بأي شكل.
      </p>

      <h2>٦. حدود المسؤولية</h2>
      <p>
        نبذل قصارى جهدنا لضمان عمل الخدمة دون انقطاع، لكننا لا نضمن وصول
        ١٠٠٪ من رسائل الواتساب نظراً لاعتمادها على مزودي خدمة خارجيين.
      </p>

      <h2>٧. إنهاء الخدمة</h2>
      <p>
        يحق لنا تعليق أو إنهاء أي حساب يخالف هذه الشروط دون إشعار مسبق.
      </p>

      <h2>٨. القانون المعمول به</h2>
      <p>
        تخضع هذه الشروط لأنظمة المملكة العربية السعودية وأي نزاع ينشأ عنها
        يُحال إلى الجهات القضائية المختصة.
      </p>
    </LegalShell>
  );
}