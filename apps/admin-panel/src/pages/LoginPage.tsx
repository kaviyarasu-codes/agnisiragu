// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.png';
import { apiPost } from '../lib/api';
import { setToken } from '../lib/auth';
import { useAuthStore } from '../store/auth.store';
import type { Admin } from '../types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAdmin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiPost<{ data: { accessToken: string; admin: Admin } }>(
        '/auth/admin/login', values
      );
      setToken(response.data.accessToken);
      setAdmin(response.data.admin);
      toast.success(`Welcome, ${response.data.admin.name}`);
      navigate('/');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel — black branding */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-ink-950 flex-col justify-between p-10">
        <div>
          <img src={logo} alt="Agnisiragu" className="h-12 w-auto" />
        </div>
        <div>
          <h2 className="text-white text-3xl font-bold leading-tight mb-4">
            Tamil news,<br />managed with precision.
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Publish breaking news, manage reporters, track analytics — all from one place.
          </p>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-xs">
          <ShieldCheck size={14} />
          <span>Secure admin access · Agnisiragu © {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-page p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-ink-950 px-5 py-3 rounded-lg">
              <img src={logo} alt="Agnisiragu" className="h-10 w-auto" />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary">Sign in</h1>
            <p className="text-sm text-text-muted mt-1">Admin Panel access only</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div>
              <label className="label">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@agnisiragu.com"
                className="input"
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="input"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red/5 border border-red/20 rounded px-3 py-2.5">
                <p className="text-sm text-red font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              ) : (
                <><span>Sign In</span><ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-8">
            Agnisiragu News Platform · Admin Portal
          </p>
        </div>
      </div>
    </div>
  );
}
