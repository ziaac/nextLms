'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  identifier: z.string().min(1, 'ID/NISN wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi').min(6, 'Minimal 6 karakter'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  role: 'siswa' | 'guru'
  domain: string
}

export function LoginForm({ role, domain }: LoginFormProps) {
  const { login, isLoading, error: serverError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    setValue('identifier', '')
  }, [role, setValue])

  const onSubmit = (data: LoginFormData) => {
    const fullEmail = `${data.identifier}${domain}`.toLowerCase()
    login({ email: fullEmail, password: data.password })
  }

  return (
    // Tambahkan suppressHydrationWarning di elemen <form>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" suppressHydrationWarning>
      {serverError && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4">
          <AlertCircle size={18} strokeWidth={1.5} className="text-red-500 dark:text-red-400 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>
        </div>
      )}

      {/* Input Identitas Akun */}
      <div className="space-y-1.5" suppressHydrationWarning>
        <label className="block text-[11px] placeholder:text-[10px] text-gray-500 dark:text-gray-400 uppercase ml-1">
          Identitas Akun
        </label>
        <div suppressHydrationWarning className={`flex rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
          errors.identifier
            ? 'border-red-300 ring-2 ring-red-100 dark:ring-red-900/40'
            : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
        }`}>
          <input
            {...register('identifier')}
            type="text"
            // Penting untuk password manager: berikan name dan id
            id="identifier"
            autoComplete="username"
            placeholder={role === 'siswa' ? 'NISN' : 'Username'}
            disabled={isLoading}
            suppressHydrationWarning
            className="w-[33%] px-4 py-3 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent outline-none focus:outline-none focus:ring-0 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:[-webkit-text-fill-color:#374151] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(55,65,81)] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#f3f4f6]"
          />
          <div className="w-[67%] flex items-center px-4 bg-gray-50/80 dark:bg-gray-600/50 border-l border-gray-100/80 dark:border-gray-600/50 text-sm text-gray-500 dark:text-gray-400 select-none">
            <span className="opacity-40 mr-1">@</span>
            {domain.replace('@', '')}
          </div>
        </div>
        {errors.identifier && (
          <p className="text-[10px] text-red-400 uppercase ml-1 italic">
            * {errors.identifier.message}
          </p>
        )}
      </div>

      {/* Input Kata Sandi */}
      <div className="space-y-1.5" suppressHydrationWarning>
        <label className="block text-[11px] text-gray-500 dark:text-gray-400 uppercase ml-1">
          Kata Sandi
        </label>
        <div suppressHydrationWarning className={`relative rounded-xl border transition-all mb-8 duration-200 overflow-hidden shadow-sm ${
          errors.password
            ? 'border-red-300 ring-2 ring-red-100 dark:ring-red-900/40'
            : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
        }`}>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            // Penting untuk password manager
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isLoading}
            suppressHydrationWarning
            className="w-full px-4 py-3 pr-12 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent outline-none focus:outline-none focus:ring-0 [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white] [&:-webkit-autofill]:[-webkit-text-fill-color:#374151] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_rgb(55,65,81)] dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#f3f4f6]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[10px] text-red-400 uppercase ml-1 italic">
            * {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] py-3 text-sm text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70 mt-2 font-medium"
      >
        {isLoading ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : <LogIn size={18} strokeWidth={1.5} />}
        {isLoading ? 'MEMVERIFIKASI...' : 'MASUK KE SISTEM'}
      </button>
    </form>
  )
}