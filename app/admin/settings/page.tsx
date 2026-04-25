'use client'

import { useState } from 'react'
import { updatePassword } from '@/app/login/actions'

export default function AdminSettingsPage() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirmPassword') as string

    if (password !== confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setIsUpdating(false)
      return
    }

    const result = await updatePassword(formData)
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully!' })
      e.currentTarget.reset()
    }
    setIsUpdating(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your administrative account and preferences.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Security Section */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
          <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Security</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Change Password</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">New Password</label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>

              {message && (
                <div className={`rounded-lg px-4 py-3 text-xs font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-primary-500 disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Account Info (Read-only) */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
           <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Account</h2>
          </div>
          <div className="p-6 space-y-4">
             <div>
                <label className="mb-1 block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Admin Email</label>
                <div className="text-sm font-medium text-gray-900 dark:text-white">shahzadyasir77@gmail.com</div>
                <p className="mt-1 text-[10px] text-gray-400">This email has full administrative access as defined in the system configuration.</p>
             </div>
             <div className="pt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  System Restriction
                </div>
                <p className="mt-1 text-[10px] text-gray-400">User management and global settings are partially restricted to the primary administrator account.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
