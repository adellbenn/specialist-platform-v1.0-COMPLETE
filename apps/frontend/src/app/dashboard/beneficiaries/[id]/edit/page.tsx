'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight, Save, Loader2, User, FileText, Stethoscope, Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouteGuard } from '@/components/auth/route-guard';
import { Card, SectionHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageLoader } from '@/components/ui/spinner';
import { beneficiariesService } from '@/services/beneficiaries.service';
import { Beneficiary, BeneficiaryFile } from '@/types';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const profileSchema = z.object({
  firstName:            z.string().min(2),
  lastName:             z.string().min(2),
  dateOfBirth:          z.string().optional(),
  gender:               z.enum(['male', 'female', '']).optional(),
  nationalId:           z.string().optional(),
  phone:                z.string().optional(),
  email:                z.string().email().optional().or(z.literal('')),
  address:              z.string().optional(),
  guardianName:         z.string().optional(),
  guardianPhone:        z.string().optional(),
  guardianRelationship: z.string().optional(),
  referralSource:       z.string().optional(),
  caseType:             z.enum(['psychological','educational','speech','occupational','social']),
  intakeDate:           z.string().optional(),
  notes:                z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditBeneficiaryPage() {
  useRouteGuard({ permission: 'beneficiary:update', redirectTo: '/dashboard/beneficiaries' });

  const { id }        = useParams<{ id: string }>();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { t }         = useTranslation();
  const initialTab    = searchParams.get('tab') === 'file' ? 'file' : 'profile';

  const [loading, setSaving]      = useState(false);
  const [fetching, setFetching]   = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'file'>(initialTab);
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [fileData, setFileData]        = useState<Partial<BeneficiaryFile>>({});

  const { register, handleSubmit, reset, formState: { errors, isDirty } } =
    useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) });

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

  useEffect(() => {
    (async () => {
      setFetching(true);
      try {
        const [bRes, fRes] = await Promise.all([
          beneficiariesService.getOne(id),
          beneficiariesService.getFile(id),
        ]);
        const b = bRes.data.data;
        setBeneficiary(b);
        setFileData(fRes.data.data);
        reset({
          firstName: b.firstName, lastName: b.lastName,
          dateOfBirth: b.dateOfBirth?.split('T')[0] ?? '',
          gender: (b.gender as any) ?? '',
          nationalId: b.nationalId ?? '',
          phone: b.phone ?? '', email: b.email ?? '',
          address: b.address ?? '',
          guardianName: b.guardianName ?? '',
          guardianPhone: b.guardianPhone ?? '',
          guardianRelationship: b.guardianRelationship ?? '',
          referralSource: b.referralSource ?? '',
          caseType: b.caseType,
          intakeDate: b.intakeDate?.split('T')[0] ?? '',
          notes: b.notes ?? '',
        });
      } catch {
        toast.error(t('beneficiaries.load_error'));
        router.push('/dashboard/beneficiaries');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, reset, router, t]);

  const saveProfile = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      await beneficiariesService.update(id, {
        ...data,
        gender: data.gender as any || undefined,
        email: data.email || undefined,
      });
      toast.success(t('beneficiaries.save_success'));
      router.push(`/dashboard/beneficiaries/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const saveFile = async () => {
    setSaving(true);
    try {
      await beneficiariesService.updateFile(id, fileData);
      toast.success(t('beneficiaries.file_save_success'));
      router.push(`/dashboard/beneficiaries/${id}?tab=file`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (fetching) return <PageLoader />;

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
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('beneficiaries.edit_title', { name: `${beneficiary?.firstName} ${beneficiary?.lastName}` })}
          </h1>
          <p className="text-sm font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{beneficiary?.fileNumber}</p>
        </div>
      </div>

      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'profile', label: t('beneficiaries.edit_profile'), icon: User },
          { id: 'file',    label: t('beneficiaries.edit_file'),    icon: FileText },
        ].map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId as any)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition',
            )}
            style={{
              borderColor: activeTab === tabId ? 'var(--primary)' : 'transparent',
              color: activeTab === tabId ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit(saveProfile)} className="space-y-5">
          <Card>
            <SectionHeader icon={User} title={t('beneficiaries.personal_info')} iconColor="text-primary" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t('beneficiaries.first_name')} required error={errors.firstName?.message} {...register('firstName')} />
              <Input label={t('beneficiaries.last_name')} required error={errors.lastName?.message} {...register('lastName')} />
              <Input label={t('beneficiaries.date_of_birth')} type="date" {...register('dateOfBirth')} />
              <Select label={t('beneficiaries.gender')} placeholder={t('common.select')} options={GENDER_OPTIONS} {...register('gender')} />
              <Input label={t('beneficiaries.national_id')} {...register('nationalId')} />
              <Input label={t('beneficiaries.intake_date')} type="date" {...register('intakeDate')} />
              <Select label={t('beneficiaries.case_type')} required options={CASE_OPTIONS} error={errors.caseType?.message} {...register('caseType')} />
              <Select label={t('beneficiaries.referral_source')} placeholder={t('common.select')} options={REFERRAL_OPTIONS} {...register('referralSource')} />
              <Input label={t('beneficiaries.phone')} type="tel" dir="ltr" {...register('phone')} />
              <Input label={t('beneficiaries.email')} type="email" dir="ltr" error={errors.email?.message} {...register('email')} />
              <div className="sm:col-span-2">
                <Input label={t('beneficiaries.address')} {...register('address')} />
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader icon={Users} title={t('beneficiaries.guardian_info')} iconColor="text-primary" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label={t('beneficiaries.guardian_name')} {...register('guardianName')} />
              <Input label={t('beneficiaries.guardian_phone')} type="tel" dir="ltr" {...register('guardianPhone')} />
              <Select label={t('beneficiaries.guardian_relationship')} placeholder={t('common.select')} options={RELATIONSHIP_OPTIONS} {...register('guardianRelationship')} />
            </div>
          </Card>

          <Card>
            <SectionHeader icon={FileText} title={t('common.notes')} iconColor="text-text-muted" />
            <Textarea placeholder={t('beneficiaries.notes_placeholder')} {...register('notes')} />
          </Card>

          <div className="flex justify-end gap-3">
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
              disabled={loading || !isDirty}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50"
              style={{ backgroundColor: loading || !isDirty ? 'var(--primary-300)' : 'var(--primary)' }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> {t('beneficiaries.saving_profile')}</>
              ) : (
                <><Save size={15} /> {t('beneficiaries.save_profile')}</>
              )}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'file' && (
        <div className="space-y-5">
          <Card>
            <SectionHeader icon={Stethoscope} title={t('beneficiaries.medical_history')} iconColor="text-info" />
            <Textarea
              value={fileData.medicalHistory ?? ''}
              onChange={(e) => setFileData((p) => ({ ...p, medicalHistory: e.target.value }))}
              rows={5}
              placeholder={t('beneficiaries.medical_history_placeholder')}
            />
          </Card>

          <Card>
            <SectionHeader icon={FileText} title={t('beneficiaries.educational_history')} iconColor="text-success" />
            <Textarea
              value={fileData.educationalHistory ?? ''}
              onChange={(e) => setFileData((p) => ({ ...p, educationalHistory: e.target.value }))}
              rows={5}
              placeholder={t('beneficiaries.educational_history_placeholder')}
            />
          </Card>

          <Card>
            <SectionHeader icon={Users} title={t('beneficiaries.family_history')} iconColor="text-primary" />
            <Textarea
              value={fileData.familyHistory ?? ''}
              onChange={(e) => setFileData((p) => ({ ...p, familyHistory: e.target.value }))}
              rows={4}
              placeholder={t('beneficiaries.family_history_placeholder')}
            />
          </Card>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 text-sm border rounded-lg transition"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={saveFile}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50"
              style={{ backgroundColor: loading ? 'var(--primary-300)' : 'var(--primary)' }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> {t('beneficiaries.saving_file')}</>
              ) : (
                <><Save size={15} /> {t('beneficiaries.save_file')}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
