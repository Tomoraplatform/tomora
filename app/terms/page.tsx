import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = { title: "Terms of Use | Tomora" };

export default function TermsPage() {
  return (
    <div className="bg-cream text-ink">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-bold sm:text-4xl">Terms of Use</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-6 text-ink/75 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink">
          <p>These terms govern your use of Tomora. By creating an account or using the service, you agree to them. If you don&apos;t agree, please don&apos;t use Tomora.</p>

          <h2>Your account</h2>
          <p>You are responsible for the activity on your account and for keeping your login secure. You must provide accurate information and be old enough to enter a binding agreement in your country.</p>

          <h2>Your content</h2>
          <p>You keep ownership of the content you add to your sites. You grant us the licence needed to host and display it as part of the service. You are responsible for your content and must have the rights to use it. Don&apos;t upload anything unlawful, infringing, deceptive or harmful.</p>

          <h2>Acceptable use</h2>
          <p>Don&apos;t use Tomora to sell prohibited goods or services, run fraudulent or misleading stores, send spam, or attempt to disrupt or reverse-engineer the platform. We may suspend or remove sites and accounts that breach these terms.</p>

          <h2>Payments &amp; payouts</h2>
          <p>Online payments are processed by Paystack and settle to the bank account you connect. You are responsible for fulfilling your customers&apos; orders, honouring your own refund and delivery policies, and for any taxes on your sales. Payment-provider fees may apply. Tomora is not a party to the transactions between you and your customers or donors.</p>

          <h2>Subscriptions</h2>
          <p>Paid plans renew for the period you select unless cancelled. Fees are shown before you pay. Except where required by law, fees already paid are non-refundable. We may change plan features or pricing with reasonable notice.</p>

          <h2>Service availability</h2>
          <p>We work to keep Tomora available and reliable, but the service is provided &ldquo;as is&rdquo; without warranties. We may update, change or discontinue features. We are not liable for indirect or consequential losses, and our total liability is limited to the amount you paid us in the previous twelve months.</p>

          <h2>Termination</h2>
          <p>You can stop using Tomora and delete your account at any time. We may suspend or end access if you breach these terms or where required for legal or security reasons.</p>

          <h2>Changes</h2>
          <p>We may update these terms from time to time. Continued use after changes take effect means you accept the updated terms.</p>

          <h2>Contact</h2>
          <p>Questions? Contact us at <a className="underline" href="mailto:support@tomora.com.ng">support@tomora.com.ng</a> or through Help &amp; Support in your dashboard.</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
