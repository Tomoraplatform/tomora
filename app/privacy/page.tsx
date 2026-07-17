import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = { title: "Privacy Policy | Tomora" };

export default function PrivacyPage() {
  return (
    <div className="bg-cream text-ink">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: {new Date().getFullYear()}</p>

        <div className="prose-tomora mt-8 space-y-6 text-ink/75 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
          <p>This policy explains what information Tomora (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects when you use our website-builder service, how we use it, and the choices you have. By using Tomora you agree to this policy.</p>

          <h2>Information we collect</h2>
          <p>When you create an account we collect your name, email address and the details you add to your site (business name, contact details, images and content). If you enable payments or donations, we collect the bank account details needed to pay you and the transaction records created through our payment provider.</p>
          <p>For sites you publish, we collect basic, non-identifying visit counts, and, where a visitor chooses to contact you, place an order or make a donation, the details they submit (such as name, email, phone and delivery address). That information belongs to you, the site owner, and is made available to you in your dashboard.</p>

          <h2>How we use information</h2>
          <p>We use your information to provide and maintain your account and websites, process payments and payouts, send you service and transactional emails, provide support, and keep the service secure. We do not sell your personal information.</p>

          <h2>Payments</h2>
          <p>Card and online payments are processed by Paystack. We do not store full card numbers. Funds from your customers or donors settle to the bank account you connect. Please review Paystack&apos;s own privacy terms for how they handle payment data.</p>

          <h2>Sharing</h2>
          <p>We share information only with the service providers that help us run Tomora (such as our hosting, email and payment partners), when required by law, or with your consent. Site visitors&apos; submissions are shared with the relevant site owner.</p>

          <h2>Data retention &amp; security</h2>
          <p>We keep your information for as long as your account is active and as needed to comply with our legal obligations. If you delete your account, associated site data is removed. We use reasonable technical and organisational measures to protect your data, though no method of transmission is completely secure.</p>

          <h2>Your rights</h2>
          <p>You can access, update or delete most of your information from your dashboard. To request deletion of your account or ask a privacy question, contact us using the details below.</p>

          <h2>Changes</h2>
          <p>We may update this policy from time to time. Material changes will be reflected by the &ldquo;last updated&rdquo; date on this page.</p>

          <h2>Contact</h2>
          <p>Questions about privacy? Reach us at <a className="underline" href="mailto:support@tomora.com.ng">support@tomora.com.ng</a> or through Help &amp; Support in your dashboard.</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
