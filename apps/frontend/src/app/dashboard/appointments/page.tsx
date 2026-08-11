import type { Metadata } from 'next';
import AppointmentsPageClient from './page-client';

export const metadata: Metadata = {
  title: 'المواعيد | منصة إدارة أدوار الأخصائيين',
  description: 'إدارة المواعيد والجلسات مع المستفيدين',
};

export default function AppointmentsPage() {
  return <AppointmentsPageClient />;
}
