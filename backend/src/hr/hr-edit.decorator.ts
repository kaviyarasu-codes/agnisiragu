// src/hr/hr-edit.decorator.ts
import { SetMetadata } from '@nestjs/common';

// Marks a route as requiring *edit* access to workforce data, not just view.
// HrAccessGuard reads this to decide whether a granted (non-SUPER_ADMIN)
// caller's HRAccessGrant.canEdit must be true, on top of canView.
export const HR_EDIT_KEY = 'hrEdit';
export const HrEdit = () => SetMetadata(HR_EDIT_KEY, true);
