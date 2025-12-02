/**
 * useRequireRole Hook
 * Hook untuk check user role dan redirect jika tidak authorized
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';

type UserRole = 'admin_pusat' | 'admin_unit' | 'user_unit';

interface UseRequireRoleOptions {
  requiredRole: UserRole | UserRole[];
  redirectTo?: string;
  showError?: boolean;
}

/**
 * Check if user has required role
 */
function hasRequiredRole(userRole: UserRole | null, requiredRole: UserRole | UserRole[]): boolean {
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  // Role hierarchy: admin_pusat > admin_unit > user_unit
  const roleHierarchy: Record<UserRole, number> = {
    admin_pusat: 3,
    admin_unit: 2,
    user_unit: 1,
  };
  
  const userLevel = roleHierarchy[userRole];
  const requiredLevel = roleHierarchy[requiredRole];
  
  // User must have equal or higher role
  return userLevel >= requiredLevel;
}

/**
 * Hook untuk require specific role
 * Redirects user jika tidak memiliki role yang diperlukan
 */
export function useRequireRole(options: UseRequireRoleOptions) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { requiredRole, redirectTo = ROUTES.DASHBOARD, showError = true } = options;

  useEffect(() => {
    if (!user) {
      navigate(ROUTES.AUTH, { replace: true });
      return;
    }

    const userRole = user.role as UserRole;
    
    if (!hasRequiredRole(userRole, requiredRole)) {
      if (showError) {
        // Show error toast (will be handled by component)
        console.warn(`Access denied: Required role ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}, but user has ${userRole}`);
      }
      navigate(redirectTo, { replace: true });
    }
  }, [user, requiredRole, redirectTo, navigate, showError]);

  return {
    hasAccess: user ? hasRequiredRole(user.role as UserRole, requiredRole) : false,
    userRole: user?.role as UserRole | null,
  };
}

/**
 * Hook untuk check permission (non-blocking)
 */
export function useHasRole(requiredRole: UserRole | UserRole[]): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  return hasRequiredRole(user.role as UserRole, requiredRole);
}

