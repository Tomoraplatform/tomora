import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { verifyTransaction } from "@/lib/paystack";
import { confirmOrdersPaid } from "@/lib/confirm-payments";
import { liveNumber } from "@/lib/live/config";
import { LIVE_REFERENCE_PREFIX } from "@/lib/live/data";

export const metadata = { title: "Payment received | Tomora", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Where Paystack returns a WhatsApp customer after they pay.
 *
 * The only page in Tomora Live a customer ever sees in a browser, so it does
 * one thing: confirm the payment and send them back to the chat. Settlement
 * also happens on the webhook; whichever arrives first wins and the second is
 * a no-op.
 */
export default async function LivePaidPage({
  searchParams,
}: {
  searchParams: { reference?: string };
}) {
  const reference = searchParams.reference || "";
  let paid = false;

  if (reference.startsWith(LIVE_REFERENCE_PREFIX)) {
    try {
      const result = await verifyTransaction(reference);
      if (result.success) {
        await confirmOrdersPaid(reference);
        paid = true;
      }
    } catch {
      // The webhook is the backstop; the customer is told to check the chat.
    }
  }

  const number = liveNumber();
  const backToChat = number ? `https://wa.me/${number}` : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-8 text-center">
        {paid ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-bold text-ink">Payment received</h1>
            <p className="mt-2 text-ink/70">
              Thank you. Your order is confirmed and the seller has been notified. We have sent the
              details to your WhatsApp.
            </p>
          </>
        ) : (
          <>
            <MessageCircle className="mx-auto h-12 w-12 text-ink/40" />
            <h1 className="mt-4 text-2xl font-bold text-ink">Checking your payment</h1>
            <p className="mt-2 text-ink/70">
              If your payment went through, we will confirm it in your WhatsApp chat within a minute.
              You do not need to pay again.
            </p>
          </>
        )}

        {backToChat && (
          <a
            href={backToChat}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-cream"
          >
            <MessageCircle className="h-4 w-4" /> Back to WhatsApp
          </a>
        )}

        <p className="mt-6 text-xs text-ink/40">
          Powered by <Link href="/" className="underline">Tomora</Link>
        </p>
      </div>
    </main>
  );
}
