'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight, Edit, Archive, User, Phone, MapPin,
  FileText, Calendar, Stethoscope, Users, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { beneficiariesService } from '@/services/beneficiaries.service';
import { Beneficiary, BeneficiaryFile as BFile, CASE_TYPE_LABELS, CASE_TYPE_COLORS, STATUS_LABELS, STATUS_COLORS, GENDER_LABELS } from '@/types';
import { Card, SectionHeader, DetailRow } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/spinner';
import { PermissionGate } from '@/components/auth/permission-gate';
import { GoalsSection } from '@/components/beneficiaries/goals-section';
import { formatDate, cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type TabId = 'profile' | 'file' | 'appointments' | 'reports';

export default function BeneficiaryDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { t }   = useTranslation();

  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [file, setFile]               = useState<BFile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<TabId>('profile');
  const [archiving, setArchiving]     = useState(false);

  const TABS: Array<{ id: TabId; label: string; icon: any }> = [
    { id: 'profile',      label: t('beneficiaries.view_profile'),      icon: User },
    { id: 'file',         label: t('beneficiaries.view_file'),         icon: FileText },
    { id: 'appointments', label: t('beneficiaries.view_appointments'), icon: Calendar },
    { id: 'reports',      label: t('beneficiaries.view_reports'),      icon: FileText },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, fRes] = await Promise.all([
        beneficiariesService.getOne(id),
        beneficiariesService.getFile(id),
      ]);
      setBeneficiary(bRes.data.data);
      setFile(fRes.data.data);
    } catch {
      toast.error(t('common.error'));
      router.push('/dashboard/beneficiaries');
    } finally {
      setLoading(false);
    }
  }, [id, router, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleArchive = async () => {
    if (!confirm(t('beneficiaries.archive_confirm'))) return;
    setArchiving(true);
    try {
      await beneficiariesService.archive(id);
      toast.success(t('beneficiaries.archive_success'));
      router.push('/dashboard/beneficiaries');
    } catch {
      toast.error(t('beneficiaries.archive_error'));
    } finally {
      setArchiving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!beneficiary) return null;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowRight size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {beneficiary.firstName} {beneficiary.lastName}
                </h1>
                <Badge
                  label={STATUS_LABELS[beneficiary.status]}
                  className={STATUS_COLORS[beneficiary.status]}
                  dot
                />
                <Badge
                  label={CASE_TYPE_LABELS[beneficiary.caseType]}
                  className={CASE_TYPE_COLORS[beneficiary.caseType]}
                />
              </div>
              <p className="text-sm mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{beneficiary.fileNumber}</p>
            </div>

            <div className="flex items-center gap-2">
              <PermissionGate permission="beneficiary:update">
                <button
                  onClick={() => router.push(`/dashboard/beneficiaries/${id}/edit`)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm border rounded-lg transition"
                  style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                >
                  <Edit size={14} /> {t('common.edit')}
                </button>
              </PermissionGate>
              <PermissionGate permission="beneficiary:archive">
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm border rounded-lg transition"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  <Archive size={14} /> {t('common.archive')}
                </button>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition',
              )}
              style={{
                borderColor: activeTab === tabId ? 'var(--primary)' : 'transparent',
                color: activeTab === tabId ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <SectionHeader icon={User} title={t('beneficiaries.personal_info')} iconColor="text-primary" />
              <div className="space-y-0.5">
                <DetailRow label={t('beneficiaries.full_name')} value={`${beneficiary.firstName} ${beneficiary.lastName}`} />
                <DetailRow label={t('beneficiaries.date_of_birth')} value={beneficiary.dateOfBirth ? formatDate(beneficiary.dateOfBirth) : null} />
                <DetailRow label={t('beneficiaries.gender')} value={beneficiary.gender ? GENDER_LABELS[beneficiary.gender] : null} />
                <DetailRow label={t('beneficiaries.national_id')} value={beneficiary.nationalId} />
                <DetailRow label={t('beneficiaries.intake_date')} value={formatDate(beneficiary.intakeDate)} />
              </div>
            </Card>

            <Card>
              <SectionHeader icon={Phone} title={t('beneficiaries.contact_info')} iconColor="text-success" />
              <div className="space-y-0.5">
                <DetailRow label={t('beneficiaries.phone')} value={beneficiary.phone} />
                <DetailRow label={t('beneficiaries.email')} value={beneficiary.email} />
                <DetailRow label={t('beneficiaries.address')} value={beneficiary.address} />
              </div>
            </Card>

            <Card>
              <SectionHeader icon={Users} title={t('beneficiaries.guardian_info')} iconColor="text-primary" />
              <div className="space-y-0.5">
                <DetailRow label={t('beneficiaries.guardian_name')} value={beneficiary.guardianName} />
                <DetailRow label={t('beneficiaries.guardian_phone')} value={beneficiary.guardianPhone} />
                <DetailRow label={t('beneficiaries.guardian_relationship')} value={beneficiary.guardianRelationship} />
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <SectionHeader icon={Stethoscope} title={t('beneficiaries.case_info')} iconColor="text-warning" />
              <div className="space-y-0.5">
                <DetailRow label={t('beneficiaries.case_type')} value={CASE_TYPE_LABELS[beneficiary.caseType]} />
                <DetailRow label={t('common.status')} value={STATUS_LABELS[beneficiary.status]} />
                <DetailRow label={t('beneficiaries.referral_source')} value={beneficiary.referralSource ?? null} />
              </div>
            </Card>

            <Card>
              <SectionHeader icon={User} title={t('beneficiaries.specialist_assigned')} iconColor="text-primary" />
              {beneficiary.assignedSpecialist ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <span className="text-sm font-bold">
                      {beneficiary.assignedSpecialist.firstName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {beneficiary.assignedSpecialist.firstName} {beneficiary.assignedSpecialist.lastName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('beneficiaries.case_specialist') || 'أخصائي'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('beneficiaries.not_assigned')}</p>
                  <PermissionGate permission="beneficiary:assign">
                    <button className="mt-2 text-xs hover:underline"
                      style={{ color: 'var(--primary)' }}>
                      {t('beneficiaries.assign_specialist')}
                    </button>
                  </PermissionGate>
                </div>
              )}
            </Card>

            {beneficiary.notes && (
              <Card>
                <SectionHeader icon={FileText} title={t('common.notes')} iconColor="text-text-muted" />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{beneficiary.notes}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'file' && file && (
        <div className="space-y-5">
          <Card>
            <SectionHeader
              icon={Stethoscope}
              title={t('beneficiaries.diagnosis')}
              subtitle={t('beneficiaries.diagnosis') || 'التشخيصات المسجّلة للحالة'}
              iconColor="text-info"
              action={
                <PermissionGate permission="file:update">
                  <button
                    onClick={() => router.push(`/dashboard/beneficiaries/${id}/edit?tab=file`)}
                    className="text-xs hover:underline flex items-center gap-1"
                    style={{ color: 'var(--primary)' }}
                  >
                    <Edit size={12} /> {t('beneficiaries.edit_file_tab')}
                  </button>
                </PermissionGate>
              }
            />
            {file.diagnosis && file.diagnosis.length > 0 ? (
              <div className="space-y-3">
                {file.diagnosis.map((d, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                      {d.code && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                          {d.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatDate(d.date)}</p>
                    {d.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{d.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>{t('beneficiaries.diagnosis_empty')}</p>
            )}
          </Card>

          <GoalsSection
            beneficiaryId={id}
            goals={file.goals ?? []}
            onUpdate={fetchData}
          />

          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <SectionHeader icon={FileText} title={t('beneficiaries.medical_history')} iconColor="var(--info)" />
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {file.medicalHistory || <span style={{ color: 'var(--text-muted)' }}>{t('beneficiaries.no_info')}</span>}
              </p>
            </Card>
            <Card>
              <SectionHeader icon={FileText} title={t('beneficiaries.educational_history')}               iconColor="text-success" />
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {file.educationalHistory || <span style={{ color: 'var(--text-muted)' }}>{t('beneficiaries.no_info')}</span>}
              </p>
            </Card>
          </div>

          <Card>
            <SectionHeader icon={Users} title={t('beneficiaries.family_history')}               iconColor="text-primary" />
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {file.familyHistory || <span style={{ color: 'var(--text-muted)' }}>{t('beneficiaries.no_info')}</span>}
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'appointments' && (
        <Card>
          <SectionHeader
            icon={Calendar}
            title={t('beneficiaries.view_appointments')}
            iconColor="text-primary"
            action={
              <PermissionGate permission="appointment:create">
                <button className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg transition"
                  style={{ backgroundColor: 'var(--primary)' }}>
                  <Plus size={13} /> {t('beneficiaries.new_appointment')}
                </button>
              </PermissionGate>
            }
          />
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <Calendar size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('beneficiaries.appointments_placeholder')}</p>
          </div>
        </Card>
      )}

      {activeTab === 'reports' && (
        <Card>
          <SectionHeader
            icon={FileText}
            title={t('beneficiaries.view_reports')}
            iconColor="text-warning"
            action={
              <PermissionGate permission="report:create">
                <button className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-lg transition"
                  style={{ backgroundColor: 'var(--primary)' }}>
                  <Plus size={13} /> {t('beneficiaries.new_report')}
                </button>
              </PermissionGate>
            }
          />
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <FileText size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('beneficiaries.reports_placeholder')}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
