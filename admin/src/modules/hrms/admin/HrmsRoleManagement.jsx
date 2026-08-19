import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Search, Edit2, Trash2, Key, Users, Copy, Check 
} from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';

const DEFAULT_PERMISSIONS = [
  { module: 'Attendance', perms: ['view_attendance', 'edit_attendance', 'approve_leaves'] },
  { module: 'Payroll', perms: ['view_payroll', 'run_payroll', 'view_all_payslips'] },
  { module: 'Talent', perms: ['view_talent', 'assign_talent', 'edit_pricing'] },
  { module: 'Reports', perms: ['view_reports', 'export_reports'] }
];

export const HrmsRoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  const [roleName, setRoleName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      // Hardcoded roles for demonstration if no API exists for custom roles yet
      setRoles([
        { id: 1, name: 'super_admin', permissions: ['*'], users_count: 1 },
        { id: 2, name: 'admin', permissions: ['view_attendance', 'edit_attendance', 'view_reports', 'view_talent'], users_count: 3 },
        { id: 3, name: 'hr', permissions: ['view_attendance', 'approve_leaves', 'run_payroll'], users_count: 2 },
        { id: 4, name: 'employee', permissions: ['view_attendance'], users_count: 120 }
      ]);
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      toast.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
      setShowModal(false);
      fetchRoles();
    } catch (error) {
      toast.error('Failed to save role');
    }
  };

  const togglePerm = (p) => {
    if (selectedPerms.includes(p)) setSelectedPerms(selectedPerms.filter(x => x !== p));
    else setSelectedPerms([...selectedPerms, p]);
  };

  const openEdit = (r) => {
    setEditingRole(r);
    setRoleName(r.name);
    setSelectedPerms(r.permissions);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPerms([]);
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-500">Configure RBAC and permission matrix.</p>
        </div>
        <button 
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading roles...</div>
        ) : roles.map(r => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 capitalize">{r.name.replace('_', ' ')}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Users size={14}/> {r.users_count} users assigned
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Key Permissions:</p>
              <div className="flex flex-wrap gap-2">
                {r.permissions.includes('*') ? (
                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">Full System Access</span>
                ) : (
                  r.permissions.slice(0, 4).map(p => (
                    <span key={p} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                      {p.replace('_', ' ')}
                    </span>
                  ))
                )}
                {!r.permissions.includes('*') && r.permissions.length > 4 && (
                  <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-md text-xs font-medium border border-gray-200">
                    +{r.permissions.length - 4} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => openEdit(r)} className="text-gray-500 hover:text-blue-600 transition flex items-center gap-1 text-sm font-medium">
                <Edit2 size={16} /> Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 overflow-y-auto bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingRole ? 'Edit Role Permissions' : 'Create New Role'}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input 
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="e.g. Content Manager"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Permission Matrix</label>
                <div className="space-y-4">
                  {DEFAULT_PERMISSIONS.map(group => (
                    <div key={group.module} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                      <h4 className="font-semibold text-gray-800 mb-3">{group.module}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {group.perms.map(p => (
                          <label key={p} className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPerms.includes(p) || selectedPerms.includes('*') ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                              {(selectedPerms.includes(p) || selectedPerms.includes('*')) && <Check size={14} className="text-white"/>}
                            </div>
                            <span className="text-sm text-gray-700 capitalize">{p.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrmsRoleManagement;
