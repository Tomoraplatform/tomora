"use client";

import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentTransaction } from "@/lib/types";

const statusColor: Record<string, string> = {
  success: "text-success",
  pending: "text-warning",
  failed: "text-error",
};

export function AdminPayments({
  transactions,
}: {
  transactions: PaymentTransaction[];
}) {
  return (
    <Card>
      <CardBody>
        <CardTitle>Payments &amp; enrollments ({transactions.length})</CardTitle>
        {transactions.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-line bg-surface-warm p-8 text-center text-sm text-muted">
            No transactions yet.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="pb-3 pr-4 font-semibold">Customer</th>
                  <th className="pb-3 pr-4 font-semibold">Amount</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-charcoal">{t.full_name}</p>
                      <p className="text-xs text-muted">{t.email}</p>
                    </td>
                    <td className="py-3 pr-4 font-semibold">
                      {formatCurrency(Number(t.amount), t.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          "font-semibold capitalize " +
                          (statusColor[t.status] || "text-muted")
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted">
                      {t.reference}
                    </td>
                    <td className="py-3 text-muted">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
