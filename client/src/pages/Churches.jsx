import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import api from '../api'
import Modal from '../components/Modal'
import { provinces, citiesByProvince } from '../data/sa-data'

export default function Churches() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedChurch, setSelectedChurch] = useState(null)
  const [churchProvince, setChurchProvince] = useState(editing?.province || '')

  const { data: churches } = useQuery({
    queryKey: ['churches'],
    queryFn: async () => (await api.get('/churches')).data,
  })

  const { data: churchDetail } = useQuery({
    queryKey: ['churchDetail', selectedChurch],
    queryFn: async () => {
      const res = await api.get(`/churches/${selectedChurch}`)
      return res.data
    },
    enabled: !!selectedChurch,
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/churches', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['churches'] }); setModalOpen(false); setEditing(null) },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/churches/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['churches'] }); setModalOpen(false); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/churches/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['churches'] }),
  })

  const openAdd = () => { setEditing(null); setChurchProvince(''); setModalOpen(true) }
  const openEdit = (c) => { setEditing(c); setChurchProvince(c.province || ''); setModalOpen(true) }

  const submit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd)
    if (editing) editMutation.mutate({ id: editing.id, data })
    else addMutation.mutate(data)
  }

  const stats = churchDetail?.stats || {}
  const members = churchDetail?.members || []
  const taskforces = churchDetail?.taskforces || []

  return (
    <div>
      <div className="bg-white rounded-card border border-border shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-syne font-bold text-[15px]">Churches</div>
          <button onClick={openAdd} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">+ Add Church</button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {churches?.map(c => (
            <div key={c.id} onClick={() => setSelectedChurch(c.id)} className={`border rounded-card p-4 cursor-pointer transition-all hover:shadow-card ${selectedChurch === c.id ? 'border-green bg-green-light/30' : 'border-border'}`}>
              <div className="font-syne font-bold text-[15px] mb-1">{c.name}</div>
              <div className="text-xs text-text-muted">{c.city}{c.province ? ', ' + c.province : ''}</div>
              <div className="flex gap-2 mt-3">
                <button onClick={(e) => { e.stopPropagation(); openEdit(c) }} className="border border-green text-green rounded-md px-2.5 py-1 text-xs font-medium hover:bg-green hover:text-white transition-all">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(c.id) }} className="bg-danger-light text-danger rounded-md px-2.5 py-1 text-xs font-medium">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedChurch && churchDetail && (
        <div className="bg-white rounded-card border border-border shadow-card mt-5">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="font-syne font-bold text-[15px]">{churchDetail.name} — Overview</div>
            <button onClick={() => setSelectedChurch(null)} className="text-text-muted text-sm">Close</button>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface rounded-card p-4">
              <div className="text-xs text-text-muted uppercase">Members</div>
              <div className="font-syne font-extrabold text-xl text-green">{stats.member_count || 0}</div>
            </div>
            <div className="bg-surface rounded-card p-4">
              <div className="text-xs text-text-muted uppercase">Male / Female</div>
              <div className="font-syne font-extrabold text-xl text-green">{stats.male_count || 0} / {stats.female_count || 0}</div>
            </div>
            <div className="bg-surface rounded-card p-4">
              <div className="text-xs text-text-muted uppercase">Avg Age</div>
              <div className="font-syne font-extrabold text-xl text-gold">{stats.avg_age || '-'}</div>
            </div>
            <div className="bg-surface rounded-card p-4">
              <div className="text-xs text-text-muted uppercase">Total Contributed</div>
              <div className="font-syne font-extrabold text-xl text-green">R{Number(stats.total_contributed || 0).toLocaleString()}</div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="font-semibold text-sm mb-2">Taskforces</div>
            <div className="flex gap-2 flex-wrap">
              {taskforces.map(t => (
                <span key={t.taskforce} className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-green-light text-green">{t.taskforce}: {t.count}</span>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="font-semibold text-sm mb-2">Members</div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-left">
                    <th className="px-3 py-2 text-[11px] font-semibold text-text-muted uppercase">Name</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-text-muted uppercase">Cell</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-text-muted uppercase">Gender</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-text-muted uppercase">Age</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-text-muted uppercase">Taskforce</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} className="border-b border-surface2">
                      <td className="px-3 py-2 font-medium">{m.first_name} {m.surname}</td>
                      <td className="px-3 py-2">{m.cell}</td>
                      <td className="px-3 py-2">{m.gender}</td>
                      <td className="px-3 py-2">{m.age}</td>
                      <td className="px-3 py-2"><span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface2 text-text-muted">{m.taskforce}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Church' : 'Add Church'}>
        <form onSubmit={submit} className="px-5 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Church Name</label><input name="name" defaultValue={editing?.name || ''} required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Province</label><select name="province" value={churchProvince} onChange={e => setChurchProvince(e.target.value)} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{provinces.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">City</label><select name="city" defaultValue={editing?.city || ''} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{(churchProvince ? (citiesByProvince[churchProvince] || []) : []).map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div className="flex gap-2.5 mt-5">
            <button type="submit" className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">{editing ? 'Update' : 'Save'} Church</button>
            <button type="button" onClick={() => setModalOpen(false)} className="border border-green text-green rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
