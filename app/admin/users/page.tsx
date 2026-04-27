import { getUsersAction, updateUserRoleAction } from '../actions'
import { revalidatePath } from 'next/cache'

export default async function UsersPage() {
  const users = await getUsersAction()

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">User Management</h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Manage system users and their permissions.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800/50">
                <th className="px-8 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold dark:bg-primary-900/30 dark:text-primary-400">
                        {user.fullName?.[0] || user.email?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-200">{user.fullName || 'Anonymous'}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                      user.role === 'admin' 
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <form action={async (formData: FormData) => {
                      'use server'
                      const userId = formData.get('userId') as string
                      const newRole = formData.get('role') as 'admin' | 'user'
                      await updateUserRoleAction(userId, newRole)
                      revalidatePath('/admin/users')
                    }} className="flex justify-end gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select 
                        name="role" 
                        defaultValue={user.role || 'user'}
                        className="rounded-lg border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold dark:border-gray-800 dark:bg-gray-900 focus:ring-primary-500"
                      >
                        <option value="user">General User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button 
                        type="submit"
                        className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black"
                      >
                        Update
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
