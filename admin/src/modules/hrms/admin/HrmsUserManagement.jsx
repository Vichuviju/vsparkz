import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Edit2, Trash2, Mail, Shield, CheckCircle, XCircle 
} from 'lucide-react';
import { api } from '../../../lib/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export const HrmsUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, data);
        toast.success('User updated successfully');
      } else {
        await api.post('/admin/users', data);
        toast.success('User created successfully');
      }
      setShowModal(false);
      reset();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User suspended');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const openEdit = (u) => {
    setEditingUser(u);
    reset({ name: u.name, email: u.email, role: u.role });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingUser(null);
    reset({ name: '', email: '', role: 'employee' });
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage employee access and roles.</p>
        </div>
        <button 
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">User Details</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-8">Loading users...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${u.name}`} alt={u.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><Mail size={12}/> {u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1 text-sm text-gray-600 capitalize">
                    <Shield size={14} className="text-blue-500"/> {u.role || 'Employee'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.is_active !== false ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                    {u.is_active !== false ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-blue-600 transition">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-600 transition">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  {...register('name', { required: true })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email"
                  {...register('email', { required: true })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  {...register('role', { required: true })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrmsUserManagement;
