import type { Metadata } from 'next';
import DashboardPageClient from './page-client';

export const metadata: Metadata = {
  title: 'لوحة التحكم | منصة إدارة أدوار الأخصائيين',
  description: 'نظرة عامة على الإحصائيات والمواعيد والمستفيدين',
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
