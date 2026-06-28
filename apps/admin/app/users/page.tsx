'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUsers(data)
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return
    await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', credentials: 'include' })
    setUsers(users.filter(u => u.id !== id))
  }

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading...</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">Users</h1>
        <Link href="/users/new" className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300">
          New User
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-400">Name</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Email</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Created</th>
              <th className="px-4 py-3 font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-medium text-zinc-100">{user.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/users/${user.id}`} className="text-xs text-zinc-400 hover:text-zinc-200">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(user.id)} className="text-xs text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
