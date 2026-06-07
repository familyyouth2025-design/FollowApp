import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import Modal from '../components/Modal'
import { provinces, citiesByProvince } from '../data/sa-data'

export default function Events() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [eventProvince, setEventProvince] = useState(editing?.province || '')

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data,
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/events', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setModalOpen(false); setEditing(null) },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/events/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setModalOpen(false); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const openAdd = () => { setEditing(null); setEventProvince(''); setModalOpen(true) }
  const openEdit = (e) => { setEditing(e); setEventProvince(e.province || ''); setModalOpen(true) }

  const uploadFlier = async (eventId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    await api.post(`/files/events/${eventId}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  }

  const submit = async (ev) => {
    ev.preventDefault()
    const fd = new FormData(ev.target)
    const data = Object.fromEntries(fd)
    data.target_amount = Number(data.target_amount)
    const flierFile = ev.target.flier.files[0]
    if (editing) {
      await editMutation.mutateAsync({ id: editing.id, data })
      if (flierFile) await uploadFlier(editing.id, flierFile)
    } else {
      const newEvent = await addMutation.mutateAsync(data)
      if (flierFile && newEvent?.id) await uploadFlier(newEvent.id, flierFile)
    }
    queryClient.invalidateQueries({ queryKey: ['events'] })
    setModalOpen(false)
    setEditing(null)
  }

  const colors = ['#1a7a4a', '#c9920a', '#2563eb', '#7c3aed', '#dc2626']

  return (
    <div>
      <div className="bg-white rounded-card border border-border shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-inter font-bold text-[15px]">Events</div>
          <div className="flex gap-2">
            <button onClick={() => window.open('/api/csv/events/export', '_blank')} className="border border-green text-green rounded-[7px] px-3 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all">⬇ Export CSV</button>
            <label className="border border-green text-green rounded-[7px] px-3 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all cursor-pointer">
              ⬆ Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return;
                const fd = new FormData(); fd.append('file', file);
                await api.post('/csv/events/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                queryClient.invalidateQueries({ queryKey: ['events'] });
                e.target.value = '';
              }} />
            </label>
            <button onClick={openAdd} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">+ Create Event</button>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events?.map((e, i) => {
            const pct = Math.round(((e.raised || 0) / (e.target_amount || 1)) * 100)
            const color = colors[i % colors.length]
            return (
              <div key={e.id} className="border border-border rounded-card overflow-hidden hover:shadow-card transition-shadow">
                <div className="h-2" style={{ background: color }} />
                <div className="p-4">
                  <div className="font-inter font-bold text-[15px] mb-1">{e.title}</div>
                  <div className="text-xs text-text-muted mb-3 leading-relaxed">
                    📅 {new Date(e.start_dt).toLocaleDateString('en-ZA')}{e.end_dt !== e.start_dt ? ' – ' + new Date(e.end_dt).toLocaleDateString('en-ZA') : ''}<br/>
                    📍 {e.address}
                  </div>
                  <div className="text-xs font-medium text-text-muted">Target: <span className="font-inter font-bold text-green text-lg">R{Number(e.target_amount).toLocaleString()}</span></div>
                  <div className="text-xs font-medium text-text-muted">Raised: <strong style={{ color }}>R{(e.raised || 0).toLocaleString()}</strong> ({pct}%)</div>
                  <div className="bg-surface2 rounded-full h-2.5 mt-2">
                    <div className="h-2.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                  </div>
                  <div className="flex gap-2 mt-3.5">
                    <button onClick={() => openEdit(e)} className="border border-green text-green rounded-md px-3 py-1.5 text-xs font-medium hover:bg-green hover:text-white transition-all">Edit</button>
                    <button onClick={() => navigate('/compose')} className="bg-green text-white rounded-md px-3 py-1.5 text-xs font-medium hover:bg-[#155d38]">Send Message</button>
                    <button onClick={() => deleteMutation.mutate(e.id)} className="bg-danger-light text-danger rounded-md px-3 py-1.5 text-xs font-medium">Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Event' : 'Create Event'}>
        <form onSubmit={submit} className="px-5 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Event Title</label><input name="title" defaultValue={editing?.title || ''} required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Start Date & Time</label><input name="start_dt" type="datetime-local" defaultValue={editing?.start_dt ? editing.start_dt.slice(0,16) : ''} required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">End Date & Time</label><input name="end_dt" type="datetime-local" defaultValue={editing?.end_dt ? editing.end_dt.slice(0,16) : ''} required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Address</label><input name="address" defaultValue={editing?.address || ''} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Province</label><select name="province" value={eventProvince} onChange={e => setEventProvince(e.target.value)} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{provinces.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">City</label><select name="city" defaultValue={editing?.city || ''} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{(eventProvince ? (citiesByProvince[eventProvince] || []) : []).map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Fundraising Target (R)</label><input name="target_amount" type="number" defaultValue={editing?.target_amount || ''} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Event Flier (Image or PDF)</label><input name="flier" type="file" accept="image/*,.pdf" className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-green file:text-white" /></div>
          </div>
          <div className="flex gap-2.5 mt-5">
            <button type="submit" className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">{editing ? 'Update' : 'Create'} Event</button>
            <button type="button" onClick={() => setModalOpen(false)} className="border border-green text-green rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
