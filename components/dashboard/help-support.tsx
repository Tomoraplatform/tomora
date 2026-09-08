"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Check, LifeBuoy, Info, FileText, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendSupportMessage } from "@/app/dashboard/(panel)/help/actions";

export function HelpAndSupport({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    if (!email.trim()) return setError("Please enter the email we should reply to.");
    if (!message.trim()) return setError("Please type your message.");
    setSending(true);
    const res = await sendSupportMessage({ subject, message, email });
    setSending(false);
    if (res.ok) { setSent(true); setSubject(""); setMessage(""); }
    else setError(res.error || "Could not send.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Help &amp; Support</h1>
        <p className="mt-1 text-ink/60">Get help, learn about Tomora, and manage your account.</p>
      </div>

      {/* Contact support */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5" /> Chat with support</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
              <Check className="h-5 w-5 shrink-0" /> Thanks, we&apos;ve got your message and will reply to your email shortly.
              <button onClick={() => setSent(false)} className="ml-auto text-xs font-semibold underline">Send another</button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Your email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Where should we reply?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you need help with?" />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what's going on…" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={send} disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send message
              </Button>
              <p className="text-xs text-ink/50">Your message reaches the Tomora team, and we reply to the address above.</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> About Tomora</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-ink/70">
          <p>Tomora is a no-code website builder for African businesses, creators, organisations and NGOs. Pick a template, make it yours, and go live on your own address, with online store, bookings, donations and secure Paystack payments built in.</p>
          <p>We handle the hosting, the checkout and the payouts so you can focus on your business. Payments settle straight to your own bank account.</p>
        </CardContent>
      </Card>

      {/* Account + legal links */}
      <Card>
        <CardHeader><CardTitle>Account &amp; policies</CardTitle></CardHeader>
        <CardContent className="divide-y divide-ink/5">
          <Link href="/dashboard/account" className="flex items-center gap-3 py-3 text-sm text-ink/80 hover:text-ink">
            <KeyRound className="h-4 w-4 text-ink/50" /> Change password <ArrowRight className="ml-auto h-4 w-4 text-ink/30" />
          </Link>
          <Link href="/privacy" target="_blank" className="flex items-center gap-3 py-3 text-sm text-ink/80 hover:text-ink">
            <FileText className="h-4 w-4 text-ink/50" /> Privacy Policy <ArrowRight className="ml-auto h-4 w-4 text-ink/30" />
          </Link>
          <Link href="/terms" target="_blank" className="flex items-center gap-3 py-3 text-sm text-ink/80 hover:text-ink">
            <FileText className="h-4 w-4 text-ink/50" /> Terms of Use <ArrowRight className="ml-auto h-4 w-4 text-ink/30" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
