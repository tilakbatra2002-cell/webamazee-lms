import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, Shield, ShieldOff } from 'lucide-react';
import { usersApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { Modal, Badge } from '../components/ui';

export default function UsersPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => usersApi.update(id, payload),
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: () => {
      toast.success('User removed');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove user'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <UserPlus size={15} /> Invite Team Member
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 dark:border-ink-800 text-left text-xs text-ink-500 uppercase tracking-wide">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="p-3">
                    <div className="skeleton h-8 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading &&
              (users || []).map((u) => (
                <tr key={u._id} className="border-b border-ink-100 dark:border-ink-800/50">
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-ink-500">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      disabled={u._id === currentUser.id}
                      onChange={(e) => updateMutation.mutate({ id: u._id, payload: { role: e.target.value } })}
                      className="input !w-auto !py-1 !text-xs"
                    >
                      <option value="admin">Admin</option>
                      <option value="outreach_manager">Outreach Manager</option>
                      <option value="support">Support</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => updateMutation.mutate({ id: u._id, payload: { isActive: !u.isActive } })}
                      disabled={u._id === currentUser.id}
                    >
                      <Badge className={u.isActive ? 'bg-brand-500/10 text-brand-600' : 'bg-red-500/10 text-red-600'}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </button>
                  </td>
                  <td className="p-3">
                    {u._id !== currentUser.id && (
                      <button onClick={() => deleteMutation.mutate(u._id)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <InviteModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function InviteModal({ open, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: (payload) => usersApi.create(payload),
    onSuccess: () => {
      toast.success('Team member added');
      qc.invalidateQueries({ queryKey: ['users'] });
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add user'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Invite Team Member" size="sm">
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input className="input" required {...register('name')} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" required {...register('email')} />
        </div>
        <div>
          <label className="label">Temporary Password</label>
          <input type="password" className="input" required minLength={6} {...register('password')} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" {...register('role')}>
            <option value="outreach_manager">Outreach Manager</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
          </select>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          Add Team Member
        </button>
      </form>
    </Modal>
  );
}
