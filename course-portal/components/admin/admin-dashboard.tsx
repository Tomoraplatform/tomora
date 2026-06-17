"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import type { AppSettings } from "@/lib/settings";
import type { ModuleWithLessons, PaymentTransaction, Student } from "@/lib/types";
import { AdminStudents } from "@/components/admin/admin-students";
import { AdminFeedback } from "@/components/admin/admin-feedback";
import { AdminPayments } from "@/components/admin/admin-payments";
import { AdminContent } from "@/components/admin/admin-content";
import { AdminSettings } from "@/components/admin/admin-settings";
import {
  Users,
  MessageSquareText,
  CreditCard,
  BookOpen,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";

export interface FeedbackRow {
  id: string;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  moduleTitle: string;
  moduleOrder: number;
  biggestTakeaway: string;
  whereStuck: string | null;
  questionForExpert: string | null;
}

type Tab = "students" | "feedback" | "payments" | "content" | "settings";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "students", label: "Students", icon: Users },
  { id: "feedback", label: "Feedback", icon: MessageSquareText },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "content", label: "Content", icon: BookOpen },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function AdminDashboard({
  adminEmail,
  students,
  completedByStudent,
  totalLessons,
  modules,
  feedback,
  transactions,
  settings,
}: {
  adminEmail: string;
  students: Student[];
  completedByStudent: Record<string, number>;
  totalLessons: number;
  modules: ModuleWithLessons[];
  feedback: FeedbackRow[];
  transactions: PaymentTransaction[];
  settings: AppSettings;
}) {
  const [tab, setTab] = useState<Tab>("students");

  const approvedCount = students.filter((s) => s.approved_status).length;
  const paidCount = students.filter((s) => s.payment_status === "paid").length;

  const stats = [
    { label: "Students", value: students.length },
    { label: "Approved", value: approvedCount },
    { label: "Paid", value: paidCount },
    { label: "Feedback", value: feedback.length },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge className="hidden sm:inline-flex">Admin</Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted md:inline">
              {adminEmail}
            </span>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent-soft"
              >
                <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <h1 className="font-editorial text-3xl font-semibold tracking-tight">
          Admin dashboard
        </h1>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-line bg-surface p-5 shadow-card"
            >
              <p className="text-3xl font-bold tracking-tight text-charcoal">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors " +
                (tab === id
                  ? "bg-accent text-white"
                  : "text-charcoal hover:bg-accent-soft")
              }
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="mt-7">
          {tab === "students" && (
            <AdminStudents
              students={students}
              completedByStudent={completedByStudent}
              totalLessons={totalLessons}
            />
          )}
          {tab === "feedback" && <AdminFeedback feedback={feedback} />}
          {tab === "payments" && <AdminPayments transactions={transactions} />}
          {tab === "content" && <AdminContent modules={modules} />}
          {tab === "settings" && <AdminSettings settings={settings} />}
        </div>
      </main>
    </div>
  );
}
