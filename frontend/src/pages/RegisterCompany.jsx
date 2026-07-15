import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Target, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterCompany() {
  const { registerCompany } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    try {
      await registerCompany(formData);
      toast.success('Workspace created! Welcome to Webamazee LMS.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-50 via-white to-brand-50 dark:from-ink-950 dark:via-ink-950 dark:to-ink-900 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow">
            <Target size={26} strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-extrabold">Create your workspace</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Every company gets its own isolated leads, users and pipeline
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div>
            <label className="label">Company Name</label>
            <input
              className="input"
              placeholder="e.g. Webamazee"
              {...register('companyName', { required: 'Company name is required' })}
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-red-500">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <label className="label">Your Name</label>
            <input
              className="input"
              placeholder="Full name"
              {...register('adminName', { required: 'Your name is required' })}
            />
            {errors.adminName && (
              <p className="mt-1 text-xs text-red-500">{errors.adminName.message}</p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@company.com"
              {...register('adminEmail', { required: 'Email is required' })}
            />
            {errors.adminEmail && (
              <p className="mt-1 text-xs text-red-500">{errors.adminEmail.message}</p>
            )}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="Minimum 6 characters"
              {...register('adminPassword', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
            />
            {errors.adminPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.adminPassword.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Workspace'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-500 dark:text-ink-400">
          Already have a workspace?{' '}
          <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
