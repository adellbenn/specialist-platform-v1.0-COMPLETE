'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight, Save, Loader2, User, Phone, Users, Stethoscope,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toDateKey } from '@/lib/utils';
import { useRouteGuard } from '@/components/auth/route-guard';
import { Card, SectionHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { beneficiariesService } from '@/services/beneficiaries.service';
import { useTranslation } from '@/lib/i18n';

const schema = z.object({
  firstName:            z.string().min(2, 'الاسم الأول مطلوب'),
  lastName:             z.string().min(2, 'اسم العائلة مطلوب'),
  dateOfBirth:          z.string().optional(),
  gender:               z.enum(['male', 'female']).optional(),
  nationalId:           z.string().optional(),
  phone:                z.string().optional(),
  email:                z.string().email('بريد إلكتروني غير صحيح').optional().or(z.literal('')),
  address:              z.string().optional(),
  guardianName:         z.string().optional(),
  guardianPhone:        z.string().optional(),
  guardianRelationship: z.string().optional(),
  referralSource:       z.enum(['self', 'hospital', 'school', 'other']).optional(),
  caseType:             z.enum(['psychological','educational','speech','occupational','social'], {
    required_error: 'نوع الحالة مطلوب',
  }),
  intakeDate: z.string().optional(),
  notes:      z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewBeneficiaryPage() {
  useRouteGuard({ permission: 'beneficiary:create', redirectTo: '/dashboard/beneficiaries' });

  const router   = useRouter();
  const { t }    = useTranslation();
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { intakeDate: toDateKey(new Date()) },
    });

  const GENDER_OPTIONS    = [{ value: 'male', label: t('beneficiaries.gender_male') }, { value: 'female', label: t('beneficiaries.gender_female') }];
  const CASE_OPTIONS      = [
    { value: 'psychological', label: t('beneficiaries.case_psychological') },
    { value: 'educational',   label: t('beneficiaries.case_educational') },
    { value: 'speech',        label: t('beneficiaries.case_speech') },
    { value: 'occupational',  label: t('beneficiaries.case_occupational') },
    { value: 'social',        label: t('beneficiaries.case_social') },
  ];
  const REFERRAL_OPTIONS  = [
    { value: 'self',     label: t('beneficiaries.referral_self') },
    { value: 'hospital', label: t('beneficiaries.referral_hospital') },
    { value: 'school',   label: t('beneficiaries.referral_school') },
    { value: 'other',    label: t('beneficiaries.referral_other') },
  ];
  const RELATIONSHIP_OPTIONS = [
    { value: 'father', label: t('beneficiaries.guardian_father') },
    { value: 'mother', label: t('beneficiaries.guardian_mother') },
    { value: 'brother', label: t('beneficiaries.guardian_brother') },
    { value: 'sister', label: t('beneficiaries.guardian_sister') },
    { value: 'grandfather', label: t('beneficiaries.guardian_grandfather') },
    { value: 'grandmother', label: t('beneficiaries.guardian_grandmother') },
    { value: 'uncle', label: t('beneficiaries.guardian_uncle') },
    { value: 'other', label: t('beneficiaries.guardian_other') },
  ];

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await beneficiariesService.create({ ...data, email: data.email || undefined });
      toast.success(t('common.success'));
      router.push(`/dashboard/beneficiaries/${res.data.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowRight size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('beneficiaries.new_title')}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('beneficiaries.new_subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <SectionHeader icon={User} title={t('beneficiaries.personal_info')} iconColor="text-primary" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={t('beneficiaries.first_name')} required placeholder={t('beneficiaries.first_name')} error={errors.firstName?.message} {...register('firstName')} />
            <Input label={t('beneficiaries.last_name')} required placeholder={t('beneficiaries.last_name')} error={errors.lastName?.message} {...register('lastName')} />
            <Input label={t('beneficiaries.date_of_birth')} type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
            <Select label={t('beneficiaries.gender')} placeholder={t('common.select')} options={GENDER_OPTIONS} error={errors.gender?.message} {...register('gender')} />
            <Input label={t('beneficiaries.national_id')} placeholder="1xxxxxxxxx" {...register('nationalId')} />
            <Input label={t('beneficiaries.intake_date')} type="date" {...register('intakeDate')} />
          </div>
        </Card>

        <Card>
          <SectionHeader icon={Phone} title={t('beneficiaries.contact_info')} iconColor="text-success" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={t('beneficiaries.phone')} type="tel" placeholder="05xxxxxxxx" dir="ltr" {...register('phone')} />
            <Input label={t('beneficiaries.email')} type="email" placeholder="example@email.com" dir="ltr" error={errors.email?.message} {...register('email')} />
            <div className="sm:col-span-2">
              <Input label={t('beneficiaries.address')} placeholder={t('beneficiaries.address')} {...register('address')} />
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader icon={Users} title={t('beneficiaries.guardian_info')} iconColor="text-primary" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={t('beneficiaries.guardian_name')} placeholder={t('beneficiaries.guardian_name')} {...register('guardianName')} />
            <Input label={t('beneficiaries.guardian_phone')} type="tel" placeholder="05xxxxxxxx" dir="ltr" {...register('guardianPhone')} />
            <Select label={t('beneficiaries.guardian_relationship')} placeholder={t('common.select')} options={RELATIONSHIP_OPTIONS} {...register('guardianRelationship')} />
            <Select label={t('beneficiaries.referral_source')} placeholder={t('common.select')} options={REFERRAL_OPTIONS} {...register('referralSource')} />
          </div>
        </Card>

        <Card>
          <SectionHeader icon={Stethoscope} title={t('beneficiaries.case_details')} iconColor="text-warning" />
          <div className="space-y-4">
            <Select label={t('beneficiaries.case_type')} required placeholder={t('common.select')} options={CASE_OPTIONS} error={errors.caseType?.message} {...register('caseType')} />
            <Textarea label={t('beneficiaries.initial_notes')} placeholder={t('beneficiaries.notes_placeholder')} {...register('notes')} />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm border rounded-lg transition"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50"
            style={{ backgroundColor: saving || !isDirty ? 'var(--primary-300)' : 'var(--primary)' }}
          >
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> {t('common.saving')}</>
            ) : (
              <><Save size={15} /> {t('common.save')}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
