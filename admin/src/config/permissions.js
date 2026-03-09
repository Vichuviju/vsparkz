/**
 * Single place to configure which paths require which permission for staff.
 * - super_admin: sees everything (including /super-admin, /roles-permissions).
 * - agency_admin: sees everything except super-admin-only paths.
 * - agency_staff / staff: sees only "base" paths + paths where they have the required permission.
 * - client, freelancer, influencer: dashboard only.
 *
 * To add a new page: add the path to STAFF_BASE_PATHS (no permission) or PATH_TO_PERMISSION (permission required).
 */

// Paths only super_admin can see
export const SUPER_ADMIN_ONLY_PATHS = ['/super-admin', '/roles-permissions', '/platform-admin'];

// Staff can see these without any extra permission (one or two items per menu can be base, rest permission-gated)
export const STAFF_BASE_PATHS = [
  '/',
  '/leads',
  '/clients',
  '/deals',
  '/projects',
  '/assign-project',
  '/requirement-gatherings',
  '/requirement-templates',
  '/seo-analyzer',
  '/strategy-reports',
  '/reports',
  '/report-templates',
  '/freelancers',
  '/influencers',
  '/pages',
  '/landing-builder',
  '/invoices',
  '/quotations',
  '/settings',
  '/system-settings',
  '/tasks-hr',
  '/social-planner',
  '/ads',
  '/seo-workspace',
  '/email-automation',
  '/workflows',
  '/vendors',
  '/knowledge-base',
  '/service-packages',
  '/brands',
  '/compliance',
  '/automation',
  '/onboarding-questionnaires',
  '/forms',
];

// Path (prefix) -> permission slug: staff need this permission to see/access this path
// One permission can cover multiple paths (e.g. services.manage for /services, /sub-services, etc.)
export const PATH_TO_PERMISSION = {
  '/agreements': 'agreements.manage',
  '/campaigns': 'campaigns.manage',
  '/agencies': 'agencies.manage',
  '/team': 'users.manage',
  '/services': 'services.manage',
  '/sub-services': 'services.manage',
  '/pricing-levels': 'services.manage',
  '/service-prices': 'services.manage',
  '/combo-packages': 'services.manage',
  '/plans': 'master.manage',
  '/integrations': 'settings.manage',
};

// Client/freelancer/influencer: only dashboard
export const PORTAL_ROLE_PATHS = ['/'];

function pathMatches(basePath, normalized) {
  if (basePath === '/') return normalized === '/';
  return normalized === basePath || normalized.startsWith(basePath + '/');
}

/**
 * Get the required permission slug for a path (for staff). Returns null if path is base or not permission-gated.
 */
export function getRequiredPermission(path) {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '');
  for (const [prefix, perm] of Object.entries(PATH_TO_PERMISSION)) {
    if (pathMatches(prefix, normalized)) return perm;
  }
  return null;
}

// Only these roles see all pages (except super_admin-only paths for non–super_admin)
const FULL_ACCESS_ROLES = ['super_admin', 'agency_admin'];

/**
 * Check if the current user (role + permissions) can access this path.
 * Used by both Sidebar (show/hide menu) and Layout (block/redirect when opening by URL).
 */
export function canAccessPath(path, role, permissions = []) {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '');
  const r = (typeof role === 'string' ? role : '').trim().toLowerCase();
  const perms = Array.isArray(permissions) ? [...permissions] : [];

  if (r === 'super_admin') return true;
  if (SUPER_ADMIN_ONLY_PATHS.some((p) => pathMatches(p, normalized))) return false;
  if (r === 'agency_admin') return true;

  if (r === 'agency_staff' || r === 'staff') {
    if (STAFF_BASE_PATHS.some((p) => pathMatches(p, normalized))) return true;
    const required = getRequiredPermission(path);
    return !!(required && perms.includes(required));
  }

  if (['client', 'freelancer', 'influencer'].includes(r)) {
    return PORTAL_ROLE_PATHS.some((p) => pathMatches(p, normalized));
  }

  // Any other role (e.g. "admin", "staff" typo, empty): only dashboard
  return normalized === '/';
}
