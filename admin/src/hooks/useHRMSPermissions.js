import { useGetRolePermissionMatrixQuery } from "@/services/rbac/rbac.api";
import { useSelector } from "react-redux";
import { useMemo, useCallback } from "react";

/**
 * Hook to check HRMS permissions for the current user.
 */
export const useHRMSPermissions = () => {
    const user = useSelector((state) => state.user.user);
    const roleId = user?.roleId;

    const { data: matrixData, isLoading } = useGetRolePermissionMatrixQuery(roleId, {
        skip: !roleId,
    });

    const { permissions, sortedPaths } = useMemo(() => {
        if (!matrixData?.data) return { permissions: {}, sortedPaths: [] };
        
        // Map to a lookup object: { [routePath]: { action1: true, action2: false, ... } }
        const perms = matrixData.data.reduce((acc, p) => {
            acc[p.routePath] = p.actions || {};
            return acc;
        }, {});
        
        // Pre-sort paths by length (descending) for efficient matching
        const sorted = Object.keys(perms).sort((a, b) => b.length - a.length);
        
        return { permissions: perms, sortedPaths: sorted };
    }, [matrixData]);

    const checkPermission = useCallback((routePath, action) => {
        // Auto-approve for super_admin or agency_admin roles
        const r = (user?.role || '').trim().toLowerCase();
        if (r === 'super_admin' || r === 'agency_admin') {
            return true;
        }

        // 1. Try Exact Match First (Fastest)
        if (permissions[routePath]) {
            if (action !== "view" && permissions[routePath]["view"] === false) {
                return false; // Master override: Cannot do anything if View is denied
            }
            return permissions[routePath][action] || false;
        }

        // 2. Best Match (Prefix) Logic using pre-sorted paths
        // Find first (most specific) path that matches the route prefix
        const bestMatch = sortedPaths.find(path => routePath.startsWith(path));
        
        if (!bestMatch) return false;
        
        if (action !== "view" && permissions[bestMatch]["view"] === false) {
            return false; // Master override: Cannot do anything if View is denied
        }

        return permissions[bestMatch][action] || false;
    }, [permissions, sortedPaths]);

    return {
        permissions,
        checkPermission,
        isLoading,
        userRole: user?.roleName,
    };
};
