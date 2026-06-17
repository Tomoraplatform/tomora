"use client";

import { useState } from "react";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { AppSettings } from "@/lib/settings";
import { SETTINGS } from "@/lib/constants";
import { Loader2, Save } from "lucide-react";

export function AdminSettings({ settings }: { settings: AppSettings }) {
  const [whatsapp, setWhatsapp] = useState(settings.whatsappLink);
  const [feedbackEmail, setFeedbackEmail] = useState(settings.feedbackEmail);
  const [price, setPrice] = useState(String(settings.coursePrice));
  const [currency, setCurrency] = useState(settings.currency);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            [SETTINGS.whatsappLink]: whatsapp,
            [SETTINGS.feedbackEmail]: feedbackEmail,
            [SETTINGS.coursePrice]: price,
            [SETTINGS.currency]: currency,
            [SETTINGS.supportEmail]: supportEmail,
          },
        }),
      });
      const data = await res.json();
      setMsg(
        data.ok
          ? { tone: "success", text: "Settings saved." }
          : { tone: "error", text: data.message || "Could not save." },
      );
    } catch {
      setMsg({ tone: "error", text: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <CardTitle>Course settings</CardTitle>
        <p className="mt-1 text-sm text-muted">
          These values control the WhatsApp invite, checkout price and feedback
          notifications.
        </p>
        <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>WhatsApp community link</Label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="https://chat.whatsapp.com/…"
            />
          </div>
          <div>
            <Label>Feedback recipient email</Label>
            <Input
              type="email"
              value={feedbackEmail}
              onChange={(e) => setFeedbackEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Support email</Label>
            <Input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Course price (major units)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="NGN"
            />
          </div>
          {msg && (
            <div className="sm:col-span-2">
              <Alert tone={msg.tone}>{msg.text}</Alert>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={17} /> Saving…
                </>
              ) : (
                <>
                  <Save size={17} /> Save settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
