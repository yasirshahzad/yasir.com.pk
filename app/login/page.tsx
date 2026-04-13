'use client'

import { useState } from 'react'
import { login, signup } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoginView, setIsLoginView] = useState(true)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = isLoginView ? await login(formData) : await signup(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {isLoginView ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p className="mt-2 border-b border-gray-200 pb-4 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
          {isLoginView
            ? 'Sign in to track your reading streaks'
            : 'Join to earn activity streaks daily'}
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => setIsLoginView(true)}
            className={`max-w-max pb-1 text-sm font-semibold transition-all ${isLoginView ? 'text-primary-500 border-primary-500 border-b-2' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLoginView(false)}
            className={`max-w-max pb-1 text-sm font-semibold transition-all ${!isLoginView ? 'text-primary-500 border-primary-500 border-b-2' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border border-gray-200 bg-white px-4 py-8 shadow-xl sm:rounded-xl sm:px-10 dark:border-gray-800 dark:bg-gray-900">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="focus:border-primary-500 focus:ring-primary-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLoginView ? 'current-password' : 'new-password'}
                  required
                  className="focus:border-primary-500 focus:ring-primary-500 block w-full min-w-0 flex-1 rounded-md border-gray-300 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Authentication Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading
                  ? 'Authenticating...'
                  : isLoginView
                    ? 'Sign in properly'
                    : 'Create account & Start tracking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
