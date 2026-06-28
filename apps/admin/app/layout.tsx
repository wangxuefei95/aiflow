'use client'

import './globals.css'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    if (pathname === '/login') return
    fetch(`${API_BASE}/users/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => {})
  }, [pathname])

  const isLogin = pathname === '/login'

  if (isLogin) {
    return (
      <html lang="en">
        <body className="font-sans antialiased">{children}</body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex h-screen bg-zinc-950">
          <aside className="flex w-56 flex-col border-r border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-4 py-4">
              <h2 className="text-sm font-semibold text-zinc-100">AI Flow Admin</h2>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-3">
              <Link
                href="/users"
                className={`block rounded px-3 py-2 text-sm ${pathname.startsWith('/users') ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
              >
                Users
              </Link>
            </nav>
            {user && (
              <div className="border-t border-zinc-800 px-4 py-3">
                <p className="text-xs font-medium text-zinc-200">{user.name}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
            )}
          </aside>
          <main className="flex-1 overflow-auto bg-zinc-950 p-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
