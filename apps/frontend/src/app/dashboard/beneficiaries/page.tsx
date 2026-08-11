import type { Metadata } from 'next';
import BeneficiariesPageClient from './page-client';

export const metadata: Metadata = {
  title: 'المستفيدين | منصة إدارة أدوار الأخصائيين',
  description: 'إدارة ومتابعة المستفيدين من خدمات المركز',
};

export default function BeneficiariesPage() {
  return <BeneficiariesPageClient />;
}
