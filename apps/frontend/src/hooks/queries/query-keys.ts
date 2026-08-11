export const queryKeys = {
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    todayAppointments: ['dashboard', 'today-appointments'] as const,
  },
  beneficiaries: {
    all: (params: object) => ['beneficiaries', 'list', params] as const,
    stats: ['beneficiaries', 'stats'] as const,
  },
  appointments: {
    all: (params: object) => ['appointments', 'list', params] as const,
    stats: ['appointments', 'stats'] as const,
  },
} as const;
