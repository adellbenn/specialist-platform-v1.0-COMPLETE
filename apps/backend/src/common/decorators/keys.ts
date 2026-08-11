// ═══════════════════════════════════════════════════════════════
// METADATA KEYS + SIMPLE DECORATORS
//
// This file is the LEAF NODE of the dependency graph.
// It imports ONLY from @nestjs/common (no app-internal deps).
// Guards, services, and modules import from here to avoid
// circular dependencies through the barrel (decorators/index.ts).
//
// The barrel file re-exports everything so the public API
// (`import { Public, IS_PUBLIC_KEY } from '@common/decorators'`)
// continues to work unchanged.
// ═══════════════════════════════════════════════════════════════

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const SKIP_RBAC_KEY = 'skipRbac';

/** مسار عام — لا يحتاج JWT (safe for circular-free imports) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
