import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api'

const nav = [
  { section: 'Overview', items: [{ label: 'Dashboard', icon: '📊', path: '/' }] },
  { section: 'People', items: [
    { label: 'Members', icon: '👥', path: '/members' },
    { label: 'Admins', icon: '🛡️', path: '/admins' },
  ]},
  { section: 'Events & Fundraising', items: [
    { label: 'Events', icon: '📅', path: '/events' },
    { label: 'Contributions', icon: '💰', path: '/contributions' },
  ]},
  { section: 'Messaging', items: [
    { label: 'Compose Message', icon: '✉️', path: '/compose' },
    { label: 'Message Log', icon: '📋', path: '/msglog' },
  ]},
  { section: 'Churches', items: [{ label: 'Churches', icon: '⛪', path: '/churches' }] },
  { section: 'Files', items: [{ label: 'File Vault', icon: '🗂️', path: '/vault' }] },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const { data: admin } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me')
      return res.data.admin
    },
  })

  const initials = admin?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  const logout = async () => {
    await api.post('/auth/logout')
    queryClient.invalidateQueries({ queryKey: ['me'] })
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-black flex flex-col z-50">
        <div className="px-5 py-6 border-b border-white/10">
          <div className="font-inter font-extrabold text-white text-base leading-tight">SAYET</div>
          <div className="text-[11px] text-white/40 mt-0.5">Admin Portal</div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {nav.map((group, i) => (
            <div key={i} className="mb-2">
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 py-1">{group.section}</div>
              {group.items.map(item => {
                const active = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                      active ? 'bg-green text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green flex items-center justify-center font-inter font-bold text-xs text-white">
              {initials}
            </div>
            <div>
              <div className="text-[13px] text-white font-medium">{admin?.name || 'Admin'}</div>
              <div className="text-[11px] text-white/40">{admin?.role === 'super_admin' ? '⭐ Super Admin' : 'Admin'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 min-h-screen">
        <header className="bg-white border-b border-border h-[60px] flex items-center justify-between px-7 sticky top-0 z-40">
          <h1 className="font-inter font-bold text-lg">
            {nav.flatMap(g => g.items).find(i => i.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="border border-green text-green rounded-[7px] px-3.5 py-1.5 text-[13px] font-medium hover:bg-green hover:text-white transition-all">
              Sign Out
            </button>
          </div>
        </header>
        <div className="p-7">{children}</div>
      </main>
    </div>
  )
}
