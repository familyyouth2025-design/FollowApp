import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { taskforces, ageRanges, provinces } from '../data/sa-data'

const vars = [
  { label: '👤 {Name}', val: '{Name}' },
  { label: '🏙️ {City}', val: '{City}' },
  { label: '🗺️ {Province}', val: '{Province}' },
  { label: '⛪ {Church}', val: '{Church}' },
  { label: '📅 {Event}', val: '{Event}' },
  { label: '🗓️ {EventDate}', val: '{EventDate}' },
  { label: '📍 {EventAddress}', val: '{EventAddress}' },
  { label: '💰 {Target}', val: '{Target}' },
]

export default function Compose() {
  const queryClient = useQueryClient()
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data,
  })
  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get('/members')).data,
  })
  const { data: savedMessages } = useQuery({
    queryKey: ['savedMessages'],
    queryFn: async () => (await api.get('/saved-messages')).data,
  })

  const [audience, setAudience] = useState('all')
  const [eventId, setEventId] = useState('')
  const [template, setTemplate] = useState(`Shalom {Name},\n\nGreetings to you and the family in {City}.\n\nWe are having our {Event} on the {EventDate} at {EventAddress}.\n\nKindly contribute towards this amazing convention.\n\nGod bless you.\nSA Youth Economy Taskforce`)
  const [preview, setPreview] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [editingSaved, setEditingSaved] = useState(null)
  const [showSaveForm, setShowSaveForm] = useState(false)

  const sendMutation = useMutation({
    mutationFn: (data) => api.post('/messages/send', data),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => api.post('/saved-messages', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['savedMessages'] }); setSaveName(''); setShowSaveForm(false); setEditingSaved(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/saved-messages/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['savedMessages'] }); setSaveName(''); setShowSaveForm(false); setEditingSaved(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/saved-messages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedMessages'] }),
  })

  const insertVar = (v) => {
    const ta = document.getElementById('msg-area')
    const pos = ta.selectionStart
    const newVal = template.slice(0, pos) + v + template.slice(pos)
    setTemplate(newVal)
    ta.focus()
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos + v.length }, 0)
  }

  const loadSaved = (msg) => {
    setTemplate(msg.template)
  }

  const handleSave = () => {
    if (!saveName.trim()) return
    if (editingSaved) {
      updateMutation.mutate({ id: editingSaved.id, data: { name: saveName, template } })
    } else {
      saveMutation.mutate({ name: saveName, template })
    }
  }

  const startEdit = (msg) => {
    setEditingSaved(msg)
    setSaveName(msg.name)
    setTemplate(msg.template)
    setShowSaveForm(true)
  }

  const generatePreview = () => {
    const selectedEvent = events?.find(e => e.id === eventId)
    const p = template
      .replace(/{Name}/g, 'Amara Nkosi')
      .replace(/{City}/g, 'Johannesburg')
      .replace(/{Province}/g, 'Gauteng')
      .replace(/{Church}/g, 'Joburg Central')
      .replace(/{Event}/g, selectedEvent?.title || 'Youth Convention 2025')
      .replace(/{EventDate}/g, selectedEvent ? new Date(selectedEvent.start_dt).toLocaleDateString('en-ZA') : 'Friday 14 August 2025')
      .replace(/{EventAddress}/g, selectedEvent?.address || 'CTICC, Cape Town')
      .replace(/{Target}/g, selectedEvent ? `R${Number(selectedEvent.target_amount).toLocaleString()}` : 'R50,000')
    setPreview(p)
    setShowPreview(true)
  }

  const handleSend = () => {
    if (!confirm('Send this message?')) return
    const audience_filter = {}
    if (audience === 'economy') audience_filter.taskforce = 'Economy'
    if (audience === 'overcomers') audience_filter.age_range = 'Overcomers'
    if (audience === 'achievers') audience_filter.age_range = 'Achievers'
    if (audience.startsWith('province:')) audience_filter.province = audience.split(':')[1]
    sendMutation.mutate({ event_id: eventId || null, audience_filter, template })
  }

  const recipientCount = () => {
    if (!members) return 0
    if (audience === 'all') return members.length
    if (audience === 'economy') return members.filter(m => m.taskforce === 'Economy').length
    if (audience === 'overcomers') return members.filter(m => m.age_range === 'Overcomers').length
    if (audience === 'achievers') return members.filter(m => m.age_range === 'Achievers').length
    if (audience.startsWith('province:')) return members.filter(m => m.province === audience.split(':')[1]).length
    return 0
  }

  return (
    <div>
      <div className="bg-white rounded-card border border-border shadow-card">
        <div className="px-5 py-4 border-b border-border"><div className="font-inter font-bold text-[15px]">Compose WhatsApp Message</div></div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Target Audience</label>
              <select value={audience} onChange={e => setAudience(e.target.value)} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green">
                <option value="all">All Members</option>
                <option value="economy">Economy Taskforce</option>
                <option value="overcomers">Overcomers (12–18)</option>
                <option value="achievers">Achievers (19–35)</option>
                {provinces.map(p => <option key={p} value={`province:${p}`}>{p} Members</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Linked Event</label>
              <select value={eventId} onChange={e => setEventId(e.target.value)} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green">
                <option value="">None</option>
                {events?.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Saved Messages</label>
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={e => { if (e.target.value) loadSaved(savedMessages.find(m => m.id === e.target.value)) }}
                  className="flex-1 px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"
                >
                  <option value="">Load saved message...</option>
                  {savedMessages?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <button onClick={() => { setShowSaveForm(true); setEditingSaved(null); setSaveName('') }} className="border border-green text-green rounded-lg px-3 py-2 text-xs font-medium hover:bg-green hover:text-white transition-all" title="Save current message">
                  💾
                </button>
              </div>
            </div>
          </div>

          {showSaveForm && (
            <div className="bg-surface rounded-lg p-4 mb-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">
                    {editingSaved ? 'Update Saved Message' : 'Save Message As'}
                  </label>
                  <input
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="e.g. Event Invitation"
                    className="w-full px-3 py-2 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"
                  />
                </div>
                <button onClick={handleSave} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">
                  {editingSaved ? 'Update' : 'Save'}
                </button>
                <button onClick={() => { setShowSaveForm(false); setEditingSaved(null); setSaveName('') }} className="border border-green text-green rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {savedMessages?.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Saved Templates</div>
              <div className="flex flex-wrap gap-2">
                {savedMessages.map(m => (
                  <div key={m.id} className="flex items-center gap-1 bg-surface border border-border rounded-full px-3 py-1.5 text-xs">
                    <button onClick={() => loadSaved(m)} className="font-medium hover:text-green">{m.name}</button>
                    <button onClick={() => startEdit(m)} className="text-text-muted hover:text-green" title="Edit">✏️</button>
                    <button onClick={() => deleteMutation.mutate(m.id)} className="text-text-muted hover:text-danger" title="Delete">🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 mb-2.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Message Template</label></div>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs text-text-muted self-center">Insert variable:</span>
            {vars.map(v => (
              <button key={v.val} onClick={() => insertVar(v.val)} className="bg-green-light text-green border border-green/20 rounded-full px-3 py-1 text-xs font-medium hover:bg-[#d0ede0] transition-colors">
                {v.label}
              </button>
            ))}
          </div>

          <textarea
            id="msg-area"
            value={template}
            onChange={e => setTemplate(e.target.value)}
            className="w-full border-[1.5px] border-border rounded-lg p-3.5 text-sm outline-none focus:border-green min-h-[180px] resize-y font-dm leading-relaxed"
          />

          <div className="flex gap-3 items-center mt-4">
            <button onClick={generatePreview} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">Preview Message</button>
            <button onClick={handleSend} className="border border-green text-green rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all">📤 Send to Selected Audience</button>
            <span className="text-xs text-text-muted">Estimated recipients: <strong>{recipientCount()}</strong></span>
          </div>

          {sendMutation.isSuccess && (
            <div className="mt-3 text-sm text-green">Message campaign created and sent!</div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="bg-white rounded-card border border-border shadow-card mt-5">
          <div className="px-5 py-4 border-b border-border"><div className="font-inter font-bold text-[15px]">Message Preview</div></div>
          <div className="p-5">
            <div className="bg-green-light rounded-xl p-4 max-w-sm text-sm leading-relaxed whitespace-pre-line">{preview}</div>
          </div>
        </div>
      )}
    </div>
  )
}
