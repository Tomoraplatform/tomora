export type LessonType = "welcome" | "video" | "worksheet";

export interface Student {
  id: string;
  full_name: string;
  email: string;
  approved_status: boolean;
  payment_status: "pending" | "paid" | "failed" | "manual";
  payment_provider: string | null;
  paystack_customer_code: string | null;
  paystack_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  student_id: string | null;
  full_name: string;
  email: string;
  provider: string;
  reference: string;
  amount: number; // major units
  currency: string;
  status: "pending" | "success" | "failed";
  raw_response: unknown;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  module_order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  lesson_order: number;
  lesson_type: LessonType;
  video_embed_url: string | null;
  pdf_view_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleFeedback {
  id: string;
  student_id: string;
  module_id: string;
  biggest_takeaway: string;
  where_stuck: string | null;
  question_for_expert: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}
