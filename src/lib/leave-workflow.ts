/**
 * Leave Workflow Configuration
 * Determines approval workflow based on work_unit_id
 */

/**
 * Work units that require central (admin_pusat) approval for annual leave
 * Work unit IDs 1-7 require: user_unit → admin_unit → admin_pusat
 */
const CENTRAL_APPROVAL_WORK_UNITS = [1, 2, 3, 4, 5, 6, 7];

/**
 * Check if a leave request requires central (admin_pusat) approval
 * @param workUnitId - The work unit ID of the employee
 * @param leaveType - The type of leave (optional, defaults to checking for 'tahunan')
 * @returns boolean - true if requires admin_pusat approval
 */
export const requiresCentralApproval = (
  workUnitId: number | null | undefined,
  leaveType?: string
): boolean => {
  // For now, this applies to all leave types for specified units
  // Can be extended to check leaveType if needed
  if (!workUnitId) return false;
  return CENTRAL_APPROVAL_WORK_UNITS.includes(workUnitId);
};

/**
 * Check if admin_unit can give final approval for a leave request
 * @param workUnitId - The work unit ID of the employee
 * @returns boolean - true if admin_unit can give final approval
 */
export const canAdminUnitFinalApprove = (
  workUnitId: number | null | undefined
): boolean => {
  // Work units 8-28 only need admin_unit approval
  if (!workUnitId) return false;
  return !CENTRAL_APPROVAL_WORK_UNITS.includes(workUnitId);
};

/**
 * Get the final approval status based on work unit
 * @param workUnitId - The work unit ID of the employee
 * @param currentRole - The current user's role
 * @returns The status to set after approval
 */
export const getApprovalStatus = (
  workUnitId: number | null | undefined,
  currentRole: string
): string => {
  if (currentRole === "admin_pusat") {
    return "approved_final";
  }

  if (currentRole === "admin_unit") {
    // Check if this unit requires central approval
    if (requiresCentralApproval(workUnitId)) {
      return "approved_by_unit"; // Still needs admin_pusat
    } else {
      return "approved_final"; // admin_unit is the final approver
    }
  }

  return "submitted";
};

/**
 * Check if admin can generate leave certificate
 * @param workUnitId - The work unit ID of the employee
 * @param status - The current status of the leave request
 * @param userRole - The current user's role
 * @param userWorkUnitId - The current user's work unit ID (for admin_unit)
 * @returns boolean - true if can generate certificate
 */
export const canGenerateLeaveCertificate = (
  workUnitId: number | null | undefined,
  status: string,
  userRole: string,
  userWorkUnitId?: number | null
): boolean => {
  // Only approved_final status can generate certificate
  if (status !== "approved_final") return false;

  if (userRole === "admin_pusat") {
    // admin_pusat can generate for units 1-7 (central approval workflow)
    return requiresCentralApproval(workUnitId);
  }

  if (userRole === "admin_unit") {
    // admin_unit can generate for units 8-28 (unit-only workflow)
    // and only for their own unit
    return (
      canAdminUnitFinalApprove(workUnitId) &&
      workUnitId === userWorkUnitId
    );
  }

  return false;
};
