/**
 * PermissionGate Component
 * Component untuk conditionally render content berdasarkan user role
 */

import { ReactNode } from 'react';
import { useHasRole } from '@/hooks/useRequireRole';

type UserRole = 'admin_pusat' | 'admin_unit' | 'user_unit';

interface PermissionGateProps {
  children: ReactNode;
  requiredRole: UserRole | UserRole[];
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * PermissionGate - Conditionally render content based on user role
 * 
 * @example
 * <PermissionGate requiredRole="admin_pusat">
 *   <AdminOnlyContent />
 * </PermissionGate>
 * 
 * <PermissionGate 
 *   requiredRole={['admin_pusat', 'admin_unit']}
 *   fallback={<p>Access denied</p>}
 * >
 *   <AdminContent />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  requiredRole,
  fallback = null,
  showError = false,
}: PermissionGateProps) {
  const hasAccess = useHasRole(requiredRole);

  if (!hasAccess) {
    if (showError) {
      console.warn(`PermissionGate: Access denied for role ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}`);
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

