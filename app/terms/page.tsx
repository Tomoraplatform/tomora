import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { SUPPORT_EMAIL } from "@/lib/support";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";
import { LIVE_COMMISSION_PERCENT } from "@/lib/live/config";

export const metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div className="bg-cream text-ink">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-bold sm:text-4xl">Terms of Use</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-ink/75 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink">
          <p>These terms govern your use of Tomora. By creating an account or using the service, you agree to them. If you don&apos;t agree, please don&apos;t use Tomora.</p>

          <h2>Your account</h2>
          <p>You are responsible for the activity on your account and for keeping your login secure. You must give accurate information and be old enough to enter a binding agreement where you live.</p>

          <h2>Your content</h2>
          <p>You keep ownership of everything you add to your sites. You grant us the licence needed to host, display and back up that content as part of running the service. You are responsible for it and must hold the rights to use it. Don&apos;t upload anything unlawful, infringing, deceptive or harmful.</p>

          <h2>Acceptable use</h2>
          <p>Don&apos;t use Tomora to sell prohibited goods or services, run fraudulent or misleading stores, solicit donations for a cause you do not represent, send spam, or attempt to disrupt or reverse-engineer the platform. We may suspend or remove sites and accounts that breach these terms.</p>

          <h2>Selling, and taking donations</h2>
          <p>Online payments are processed by Paystack. Money from your customers and donors is split at Paystack and settles into the bank account you connect, so it reaches you directly and is never held by Tomora. Your dashboard records those payments so your history is complete; that record is not a balance we owe you.</p>
          <p>You are responsible for fulfilling orders, honouring your own refund and delivery policies, answering your customers, and for any taxes on what you sell or receive. Refunds and chargebacks are settled between you, your customer and Paystack. Tomora is not a party to those transactions.</p>
          <p>If you raise donations, you are responsible for describing the cause honestly and for using the funds as described. Offline amounts you enter yourself are shown for transparency and are never paid through Tomora.</p>

          <h2>What Tomora charges</h2>
          <h3>Subscriptions</h3>
          <p>Paid plans renew for the period you select unless cancelled before renewal. Fees are shown before you pay. Except where the law requires otherwise, fees already paid are non-refundable. We may change plan features or pricing with reasonable notice.</p>

          <h3>Tomora Live</h3>
          <p>Activating Tomora Live is free. We take {LIVE_COMMISSION_PERCENT}% of each sale that comes through WhatsApp, and nothing else. Sales made through your website are not charged this commission.</p>

          <h3>Courses and other services</h3>
          <p>Where you sell courses or other paid content through Tomora, a platform fee applies to each sale. The fee is shown to you before you publish, and is taken at the point the sale settles.</p>

          <h3>Custom domains</h3>
          <p>You may publish free on a Tomora subdomain, or connect a custom domain. Where a domain is purchased or renewed through us, the price is shown before you buy and registration is subject to the registry&apos;s own terms.</p>

          <h2>Test mode</h2>
          <p>Tomora provides a sandbox so you can try selling without real money moving. Test orders and test payments are kept apart from your real records and carry no value. Don&apos;t present test data to customers as real.</p>

          <h2>The sites you publish</h2>
          <p>Visitors to your published site are your visitors. You decide what you collect from them and you are responsible for telling them so, including your own privacy notice where the law requires one. Our own advertising and analytics tools do not run on your published sites.</p>

          <h2>Service availability</h2>
          <p>We work to keep Tomora available and reliable, but the service is provided &ldquo;as is&rdquo; and without warranties. We may update, change or discontinue features. We are not liable for indirect or consequential losses, including lost profits or lost sales, and our total liability to you is limited to the amount you paid us in the twelve months before the claim.</p>
          <p>Parts of Tomora depend on services we do not control, including Paystack, WhatsApp and our hosting and email providers. We are not responsible for their outages, though we will act reasonably to restore service.</p>

          <h2>Termination</h2>
          <p>You can stop using Tomora and delete your account at any time. We may suspend or end access if you breach these terms, or where required for legal or security reasons. On termination your sites stop being published; export anything you want to keep first.</p>

          <h2>Changes</h2>
          <p>We may update these terms. Continued use after a change takes effect means you accept the updated terms, and the &ldquo;last updated&rdquo; date above tells you when they last changed.</p>

          <h2>Governing law</h2>
          <p>These terms are governed by the laws of the Federal Republic of Nigeria, and the courts of Nigeria have jurisdiction over any dispute, without affecting rights you may have under the law of the country you live in.</p>

          <h2>Contact</h2>
          <p>Questions? Write to <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or use Help &amp; Support in your dashboard.</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
