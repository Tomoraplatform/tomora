import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { SUPPORT_EMAIL } from "@/lib/support";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="bg-cream text-ink">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: {LEGAL_LAST_UPDATED}</p>

        <div className="prose-tomora mt-8 space-y-6 text-ink/75 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink">
          <p>This policy explains what information Tomora (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects when you use our website-builder service, how we use it, and the choices you have. By using Tomora you agree to this policy.</p>

          <h2>Who this policy is about</h2>
          <p>Tomora serves two kinds of people, and it matters which one you are.</p>
          <p><strong>If you build a site with us</strong>, you are our customer and this policy describes how we handle your information.</p>
          <p><strong>If you are visiting, buying from or donating to a site built with Tomora</strong>, the person or organisation who runs that site decides what happens with your information. We hold and process it on their behalf. Contact them first with any request about your data; we will help them respond.</p>

          <h2>Information we collect</h2>
          <h3>Your account</h3>
          <p>Your name, email address, and the details you add to your site: business name, contact details, logo, images and written content. If you take payments or donations, the bank account you connect for payouts and the records of transactions made through our payment provider.</p>

          <h3>From visitors to your published site</h3>
          <p>Basic, non-identifying visit counts, and, where a visitor chooses to contact you, place an order or make a donation, the details they submit, such as name, email, phone number and delivery address. That information belongs to you, the site owner, and appears in your dashboard.</p>

          <h3>If you activate Tomora Live</h3>
          <p>Tomora Live runs your shop inside WhatsApp. When a customer messages your store, we process their WhatsApp phone number, the messages exchanged with the automated shop, and the cart and order that result, so the conversation can continue and the order can be fulfilled. Those messages pass through WhatsApp, which is operated by Meta under its own terms and privacy policy. Live only does this once you switch it on.</p>

          <h3>Support requests</h3>
          <p>When you write to us through Help &amp; Support, we store your message, the address you asked us to reply to, and the account it came from, so that a request cannot be lost and so we can answer it.</p>

          <h2>Analytics and advertising</h2>
          <p>On Tomora&apos;s own marketing site and dashboard we use the TikTok pixel to measure how well our advertising works. It records page views and events such as creating an account or subscribing, and for those events we send TikTok a hashed, irreversible form of an email address or phone number so it can match the action to an ad. We never send these in the clear.</p>
          <p><strong>This does not run on the sites you publish.</strong> A visitor to your shop or your organisation&apos;s page is your visitor, not ours, and our advertising tools are deliberately disabled there. If you add your own analytics to your site, that is your choice and your responsibility to disclose.</p>

          <h2>How we use information</h2>
          <p>To provide and maintain your account and websites, process payments and payouts, send service and transactional emails such as order, donation and support notifications, provide support, measure and improve the service, and keep it secure. We do not sell your personal information.</p>

          <h2>Payments</h2>
          <p>Card and online payments are processed by Paystack. We do not see or store full card numbers. Money paid by your customers and donors is split at Paystack and settles into the bank account you connected, so it reaches you directly rather than being held by us. Your dashboard records those payments so your history is complete. Please review Paystack&apos;s own privacy terms for how they handle payment data.</p>

          <h2>Who we share information with</h2>
          <p>Only with the providers that run the service for us, when the law requires it, or with your consent. Those providers are Supabase (database and accounts), Vercel (hosting), Paystack (payments), Resend (email), TikTok (advertising measurement, as described above) and, if you activate Tomora Live, Meta&apos;s WhatsApp Business Platform. Submissions made by visitors to your site are shared with you, its owner.</p>

          <h2>Keeping information, and keeping it safe</h2>
          <p>We keep your information for as long as your account is active and for as long as we must to meet legal and accounting obligations. Deleting your account removes the site data associated with it; records we are required to retain, such as transaction history, are kept for that period. We use reasonable technical and organisational measures to protect your data, though no method of transmission or storage is completely secure.</p>

          <h2>Your rights</h2>
          <p>You can access, correct or delete most of your information directly in your dashboard. You may also ask us for a copy of your data, ask us to correct or delete it, or object to how we use it. Nigeria&apos;s Data Protection Act gives you these rights, and we honour equivalent requests wherever you are. Write to us and we will respond.</p>

          <h2>Children</h2>
          <p>Tomora is for businesses and organisations and is not intended for children. We do not knowingly collect information from anyone under 18.</p>

          <h2>Changes</h2>
          <p>We may update this policy. Material changes are reflected in the &ldquo;last updated&rdquo; date above, and we will tell you directly where the change is significant.</p>

          <h2>Contact</h2>
          <p>Questions about privacy, or a request about your data? Write to <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or use Help &amp; Support in your dashboard.</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
