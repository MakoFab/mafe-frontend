'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Overlay — mobile only, behind the drawer ── */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* ── Sidebar / mobile drawer ── */}
      <Sidebar
        mobileOpen={menuAbierto}
        onClose={() => setMenuAbierto(false)}
      />

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMenuAbierto(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
