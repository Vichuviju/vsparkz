import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function RolesAndPermissions() {
  const { user: currentUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [userRoleUpdates, setUserRoleUpdates] = useState({});

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const fetchData = () => {
    if (!isSuperAdmin) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/admin/roles-with-permissions'),
      api.get('/admin/permissions'),
      api.get('/admin/super-admin/users', { params: { per_page: 500 } }),
    ])
      .then(([rolesRes, permsRes, usersRes]) => {
        setRoles(rolesRes.data || []);
        setPermissions(permsRes.data || []);
        const list = usersRes.data?.data ?? usersRes.data ?? [];
        setUsers(Array.isArray(list) ? list : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin]);

  const openEditRole = (role) => {
    setEditingRole(role);
    setSelectedPermIds(role.permission_ids || []);
  };

  const closeEditRole = () => {
    setEditingRole(null);
    setSelectedPermIds([]);
  };

  const togglePermission = (permId) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const saveRolePermissions = async () => {
    if (!editingRole) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/roles/${editingRole.id}/permissions`, {
        permission_ids: selectedPermIds,
      });
      fetchData();
      closeEditRole();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleUserRoleChange = (userId, roleSlug) => {
    setUserRoleUpdates((prev) => ({ ...prev, [userId]: roleSlug }));
  };

  const saveUserRole = async (user) => {
    const newRole = userRoleUpdates[user.id];
    if (newRole == null || newRole === (user.roles?.[0]?.slug ?? user.role)) return;
    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/super-admin/users/${user.id}`, {
        role: newRole,
        tenant_id: user.tenant_id ?? null,
      });
      setUserRoleUpdates((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-amber-800 dark:text-amber-200">
        Access restricted. Super admin only.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent/30 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold dark:text-text-primary text-gray-900">Roles & Permissions</h1>
        <p className="mt-1 text-sm dark:text-text-muted text-gray-500">
          Assign permissions to roles and roles to users. Control access for employees, clients, and admins.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-vsparkz bg-accent-muted/20 border border-accent-muted/40 dark:text-accent-bright text-sm">
          {error}
        </div>
      )}

      {/* Roles and their permissions */}
      <div className="glass-card overflow-hidden">
        <h2 className="px-5 py-4 border-b dark:border-navy-600 border-gray-200 font-semibold dark:text-text-primary text-gray-900">
          Roles & permissions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Role</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Permissions count</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50"
                >
                  <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">{role.name}</td>
                  <td className="px-5 py-3 dark:text-text-muted text-gray-500">
                    {(role.permission_ids || []).length} permissions
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => openEditRole(role)}
                      className="text-accent hover:dark:text-accent-bright font-medium"
                    >
                      Edit permissions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users and role assignment */}
      <div className="glass-card overflow-hidden">
        <h2 className="px-5 py-4 border-b dark:border-navy-600 border-gray-200 font-semibold dark:text-text-primary text-gray-900">
          Users & role assignment
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="dark:bg-navy-800/50 bg-gray-50 text-left">
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Name</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Email</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Agency</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Role</th>
                <th className="px-5 py-3 dark:text-text-muted text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 dark:text-text-muted text-gray-500 text-center">
                    No users
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const currentRole = u.roles?.[0]?.slug ?? u.role;
                  const selectedRole = userRoleUpdates[u.id] ?? currentRole;
                  const hasChange = selectedRole !== currentRole;
                  return (
                    <tr
                      key={u.id}
                      className="border-t dark:border-navy-600 border-gray-200 dark:hover:bg-navy-700/30 hover:bg-gray-50"
                    >
                      <td className="px-5 py-3 dark:text-text-primary text-gray-900 font-medium">{u.name}</td>
                      <td className="px-5 py-3 dark:text-text-muted text-gray-500">{u.email}</td>
                      <td className="px-5 py-3 dark:text-text-muted text-gray-500">{u.agency?.name ?? '—'}</td>
                      <td className="px-5 py-3">
                        <select
                          value={selectedRole}
                          onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
                          className="px-2 py-1.5 border dark:border-navy-600 border-gray-200 dark:bg-navy-800/80 bg-white rounded-vsparkz dark:text-text-primary text-gray-900 text-sm"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.slug}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        {hasChange && (
                          <button
                            type="button"
                            onClick={() => saveUserRole(u)}
                            disabled={saving}
                            className="text-accent hover:dark:text-accent-bright font-medium disabled:opacity-50"
                          >
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit role permissions */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card max-w-2xl w-full p-6 my-8 border dark:border-navy-600 border-gray-200">
            <h2 className="text-lg font-semibold dark:text-text-primary text-gray-900 mb-4">
              Permissions for: {editingRole.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2 p-2 rounded-vsparkz hover:dark:bg-navy-700/50 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermIds.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="rounded border-gray-300 dark:border-navy-500 text-accent focus:ring-accent/30"
                  />
                  <span className="text-sm dark:text-text-primary text-gray-900">{perm.name}</span>
                  <span className="text-xs dark:text-text-muted text-gray-500">({perm.slug})</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={saveRolePermissions}
                disabled={saving}
                className="btn-primary px-4 py-2 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={closeEditRole}
                className="px-4 py-2 border dark:border-navy-600 border-gray-200 rounded-vsparkz dark:text-text-primary text-gray-900 hover:bg-navy-700/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
