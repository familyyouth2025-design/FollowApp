import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats } = useQuery({
    queryKey: ['memberStats'],
    queryFn: async () => (await api.get('/members/stats')).data,
  })
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data,
  })
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data.admin,
  })
  const { data: wa } = useQuery({
    queryKey: ['waStatus'],
    queryFn: async () => (await api.get('/whatsapp/status')).data,
    refetchInterval: 5000,
  })
  const { data: qrData, refetch: refetchQR } = useQuery({
    queryKey: ['waQR'],
    queryFn: async () => (await api.get('/whatsapp/qr')).data,
    enabled: wa?.state === 'disconnected' || wa?.state === 'connecting' || wa?.state === 'qr',
    retry: false,
  })
  const qr = qrData?.qr

  // Auto-refresh QR and status when not ready
  useEffect(() => {
    if (!wa?.ready) {
      const interval = setInterval(() => {
        refetchQR()
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [wa?.ready, refetchQR])

  // Also show QR inline when state is qr or connecting
  const showQRInline = qr || wa?.state === 'qr' || wa?.state === 'connecting'

  const flagged = Number(stats?.flagged || 0)
  const total = Number(stats?.total_members || 0)
  const activeEvents = events?.length || 0
  const totalRaised = events?.reduce((s, e) => s + (e.raised || 0), 0) || 0

  const connectWA = async () => {
    try {
      const res = await api.get('/whatsapp/qr')
      if (res.data.qr) {
        window.open(res.data.qr, '_blank')
      }
    } catch (e) {
      console.error('Failed to get QR', e)
    }
  }
  const disconnectWA = () => { api.post('/whatsapp/disconnect') }
  const clearWASession = async () => {
    if (!confirm('Clear WhatsApp session? You will need to scan QR code again.')) return
    await api.post('/whatsapp/clear-session')
    alert('WhatsApp session cleared. Restart the server to generate a new QR code.')
  }

  return (
    <div>
      {flagged > 0 && (
        <div className="bg-danger-light border border-danger/20 rounded-card px-5 py-3 mb-5 flex items-center gap-3 text-sm">
          <strong className="text-danger">⚠️ {flagged} members</strong> have cell numbers not registered on WhatsApp.
          <button onClick={() => navigate('/members')} className="text-danger font-semibold underline ml-auto">Review now →</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white rounded-card p-5 border border-border shadow-card">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Total Members</div>
          <div className="font-inter font-extrabold text-[28px] text-green mt-1">{total}</div>
        </div>
        <div className="bg-white rounded-card p-5 border border-border shadow-card">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Active Events</div>
          <div className="font-inter font-extrabold text-[28px] text-gold mt-1">{activeEvents}</div>
        </div>
        <div className="bg-white rounded-card p-5 border border-border shadow-card">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Total Raised</div>
          <div className="font-inter font-extrabold text-[28px] text-green mt-1">R{totalRaised.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-card p-5 border border-border shadow-card">
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Flagged Numbers</div>
          <div className="font-inter font-extrabold text-[28px] text-danger mt-1">{flagged}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-card border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-inter font-bold text-[15px]">Recent Events</div>
            <button onClick={() => navigate('/events')} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">View All</button>
          </div>
          <div className="p-5 space-y-4">
            {events?.slice(0, 3).map(e => {
              const pct = Math.round((e.raised / (e.target_amount || 1)) * 100)
              return (
                <div key={e.id}>
                  <div className="font-semibold text-sm">{e.title}</div>
                  <div className="text-xs text-text-muted mt-0.5 mb-2">
                    {new Date(e.start_dt).toLocaleDateString('en-ZA')} · {e.address}
                  </div>
                  <div className="text-xs font-medium text-text-muted">Raised: <strong>R{(e.raised || 0).toLocaleString()}</strong> / R{Number(e.target_amount).toLocaleString()}</div>
                  <div className="bg-surface2 rounded-full h-2.5 mt-1.5">
                    <div className="h-2.5 rounded-full bg-green transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-card border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-inter font-bold text-[15px]">WhatsApp Status</div>
            <div className="flex gap-2">
              {me?.role === 'super_admin' && (
                <button onClick={clearWASession} className="border border-danger text-danger rounded-[7px] px-3 py-2 text-[13px] font-medium hover:bg-danger hover:text-white transition-all" title="Clear saved QR/session">
                  🗑️ Clear Session
                </button>
              )}
              {wa?.ready ? (
                <button onClick={disconnectWA} className="bg-danger text-white rounded-[7px] px-4 py-2 text-[13px] font-medium">Disconnect</button>
              ) : (
                <button onClick={connectWA} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">Connect</button>
              )}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${wa?.ready ? 'bg-green-mid' : 'bg-danger'}`} />
              <span className="text-xs text-text-muted">WhatsApp: {wa?.ready ? 'Connected' : 'Disconnected'}</span>
            </div>
            {qr && !wa?.ready && (
              <div className="text-center p-5 bg-surface rounded-lg">
                <img src={qr} alt="QR Code" className="mx-auto w-48 h-48" />
                <div className="text-xs text-text-muted mt-2">Scan with WhatsApp on your phone</div>
                {wa?.info?.pushname && (
                  <div className="text-xs text-green mt-1">Connected as: {wa.info.pushname}</div>
                )}
              </div>
            )}
            {!qr && !wa?.ready && (
              <div className="text-center p-5 bg-surface rounded-lg text-[13px] text-text-muted">
                <div className="mb-3">Click "Connect" to generate QR code.</div>
                <button onClick={connectWA} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">Generate QR Code</button>
                <div className="mt-3">
                  <button onClick={() => window.open('https://web.whatsapp.com', '_blank')} className="text-green text-xs underline hover:no-underline">
                    Or link with phone number instead →
                  </button>
                </div>
              </div>
            )}
            {wa?.ready && (
              <div className="text-center p-5 bg-surface rounded-lg">
                <div className="text-green font-semibold text-[15px]">✓ WhatsApp session active</div>
                <div className="text-xs text-text-muted mt-1.5">
                  Connected as: <strong className="text-green">{wa?.info?.pushname || 'Unknown'}</strong>
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  Number: <strong>+{wa?.info?.wid?.user || 'N/A'}</strong> · {wa?.info?.platform || ''}
                </div>
                <div className="text-xs text-text-muted mt-1">Messages can now be sent</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
