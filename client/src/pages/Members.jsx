import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import api from '../api'
import Modal from '../components/Modal'
import ChurchInput from '../components/ChurchInput'
import { provinces, taskforces, ageRanges, citiesByProvince } from '../data/sa-data'

export default function Members() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ province: '', taskforce: '', age_range: '', flagged: '' })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const [sort, setSort] = useState({ key: 'first_name', dir: 'asc' })

  const { data: members } = useQuery({
    queryKey: ['members', { ...filters, search }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.province) params.append('province', filters.province)
      if (filters.taskforce) params.append('taskforce', filters.taskforce)
      if (filters.age_range) params.append('age_range', filters.age_range)
      if (filters.flagged) params.append('flagged', 'true')
      if (search) params.append('search', search)
      const res = await api.get(`/members?${params.toString()}`)
      return res.data
    },
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/members', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); setModalOpen(false); setEditing(null) },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/members/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); setModalOpen(false); setEditing(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/members/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  })

  const [formData, setFormData] = useState({})

  const submit = (e) => {
    e.preventDefault()
    if (editing) editMutation.mutate({ id: editing.id, data: formData })
    else addMutation.mutate(formData)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'birthday' && value) {
        updated.age = getAgeFromBirthday(value)
        updated.age_range = getAgeRange(updated.age)
      }
      if (name === 'age' && value) {
        updated.birthday = getBirthdayFromAge(value)
        updated.age_range = getAgeRange(value)
      }
      return updated
    })
  }

  const openAdd = () => { setEditing(null); setFormData({}); setModalOpen(true) }
  const openEdit = (m) => { setEditing(m); setFormData({ ...m }); setModalOpen(true) }

  const cities = filters.province ? (citiesByProvince[filters.province] || []) : []
  const editCities = editing?.province ? (citiesByProvince[editing.province] || []) : []

  const sortedMembers = React.useMemo(() => {
    if (!members) return []
    const sorted = [...members]
    sorted.sort((a, b) => {
      const aVal = a[sort.key] || ''
      const bVal = b[sort.key] || ''
      if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [members, sort])

  const handleSort = (key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const getAgeFromBirthday = (birthday) => {
    if (!birthday) return ''
    const birth = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const getBirthdayFromAge = (age) => {
    if (!age) return ''
    const year = new Date().getFullYear() - parseInt(age)
    return `${year}-01-31`
  }

  const getAgeRange = (age) => {
    if (!age) return ''
    return parseInt(age) > 35 ? 'Achievers' : 'Overcomers'
  }

  return (
    <div>
      <div className="bg-white rounded-card border border-border shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-inter font-bold text-[15px]">Members</div>
          <div className="flex gap-2">
            <button onClick={() => window.open('/api/csv/members/export', '_blank')} className="border border-green text-green rounded-[7px] px-3 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all">⬇ Export CSV</button>
            <label className="border border-green text-green rounded-[7px] px-3 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all cursor-pointer">
              ⬆ Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                const file = e.target.files[0]; if (!file) return;
                const fd = new FormData(); fd.append('file', file);
                const res = await api.post('/csv/members/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                setImportResult(res.data);
                queryClient.invalidateQueries({ queryKey: ['members'] });
                e.target.value = '';
              }} />
            </label>
            <button onClick={openAdd} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">+ Add Member</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 px-5 py-3.5 bg-surface border-b border-border">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, number, city..." className="px-3 py-2 border-[1.5px] border-border rounded-[7px] text-[13px] outline-none focus:border-green min-w-[200px]" />
          <select value={filters.province} onChange={e => setFilters(f => ({ ...f, province: e.target.value }))} className="px-3 py-2 border-[1.5px] border-border rounded-[7px] text-[13px] outline-none focus:border-green">
            <option value="">All Provinces</option>
            {provinces.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={filters.taskforce} onChange={e => setFilters(f => ({ ...f, taskforce: e.target.value }))} className="px-3 py-2 border-[1.5px] border-border rounded-[7px] text-[13px] outline-none focus:border-green">
            <option value="">All Taskforces</option>
            {taskforces.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filters.age_range} onChange={e => setFilters(f => ({ ...f, age_range: e.target.value }))} className="px-3 py-2 border-[1.5px] border-border rounded-[7px] text-[13px] outline-none focus:border-green">
            <option value="">All Age Ranges</option>
            {ageRanges.map(a => <option key={a}>{a}</option>)}
          </select>
          <select value={filters.flagged} onChange={e => setFilters(f => ({ ...f, flagged: e.target.value }))} className="px-3 py-2 border-[1.5px] border-border rounded-[7px] text-[13px] outline-none focus:border-green">
            <option value="">All Status</option>
            <option value="flagged">⚠️ Flagged</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left">
            <th onClick={() => handleSort('first_name')} className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-green">Name {sort.key === 'first_name' && (sort.dir === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('cell')} className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-green">Cell {sort.key === 'cell' && (sort.dir === 'asc' ? '▲' : '▼')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">WhatsApp</th>
                <th onClick={() => handleSort('province')} className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-green">Province {sort.key === 'province' && (sort.dir === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('city')} className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-green">City {sort.key === 'city' && (sort.dir === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('taskforce')} className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-green">Taskforce {sort.key === 'taskforce' && (sort.dir === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('age_range')} className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-green">Age Range {sort.key === 'age_range' && (sort.dir === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('church')} className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-green">Church {sort.key === 'church' && (sort.dir === 'asc' ? '▲' : '▼')}</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers?.map(m => {
                const isIncomplete = !m.gender || !m.age || !m.province || !m.city || !m.church || !m.taskforce || !m.age_range;
                return (
                <tr key={m.id} className={`border-b border-surface2 hover:bg-surface ${isIncomplete ? 'bg-[#fff3cd]/40' : ''}`}>
                  <td className="px-4 py-3 font-semibold">
                    {m.first_name} {m.surname}
                    {isIncomplete && <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#fff3cd] text-[#856404]" title="Details incomplete">!</span>}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`https://wa.me/${m.cell.replace(/^0/, '27')}`} target="_blank" rel="noopener noreferrer" className="text-green hover:underline" title="Open WhatsApp chat">
                      {m.cell}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {m.whatsapp_valid ? <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-light text-green">✓ Active</span>
                      : <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#fff3cd] text-[#856404]">⚠️ Not on WA</span>}
                  </td>
                  <td className="px-4 py-3">{m.province}</td>
                  <td className="px-4 py-3">{m.city}</td>
                  <td className="px-4 py-3"><span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface2 text-text-muted">{m.taskforce}</span></td>
                  <td className="px-4 py-3">{m.age_range}</td>
                  <td className="px-4 py-3">{m.church}</td>
                  <td className="px-4 py-3 flex gap-1.5">
                    <button onClick={() => openEdit(m)} className="border border-green text-green rounded-md px-2.5 py-1 text-xs font-medium hover:bg-green hover:text-white transition-all">Edit</button>
                    <button onClick={() => deleteMutation.mutate(m.id)} className="bg-danger-light text-danger rounded-md px-2.5 py-1 text-xs font-medium">Remove</button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {importResult && (
        <div className="bg-white rounded-card border border-border shadow-card mb-5 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-inter font-bold text-[15px]">Import Results</div>
            <button onClick={() => setImportResult(null)} className="text-text-muted text-sm">✕</button>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="bg-green-light rounded-card p-3 text-center">
              <div className="text-xs text-text-muted">Imported</div>
              <div className="font-syne font-extrabold text-xl text-green">{importResult.imported || 0}</div>
            </div>
            <div className="bg-blue-50 rounded-card p-3 text-center">
              <div className="text-xs text-text-muted">Updated</div>
              <div className="font-syne font-extrabold text-xl text-blue-600">{importResult.updated || 0}</div>
            </div>
            <div className="bg-surface rounded-card p-3 text-center">
              <div className="text-xs text-text-muted">Skipped</div>
              <div className="font-syne font-extrabold text-xl text-text-muted">{importResult.skipped || 0}</div>
            </div>
            <div className="bg-[#fff3cd] rounded-card p-3 text-center">
              <div className="text-xs text-text-muted">Incomplete</div>
              <div className="font-syne font-extrabold text-xl text-[#856404]">{importResult.incomplete || 0}</div>
            </div>
          </div>
          {importResult.incomplete > 0 && (
            <div className="bg-[#fff3cd] border border-[#ffeeba] rounded-card p-3">
              <div className="text-xs font-semibold text-[#856404] mb-1">⚠️ Members with incomplete details:</div>
              <div className="text-xs text-[#856404] max-h-32 overflow-y-auto">
                {importResult.incompleteMembers?.map(m => (
                  <span key={m.id} className="inline-block mr-3 mb-1">{m.name} <span className="text-text-muted">(missing: {m.missing.join(', ')})</span></span>
                ))}
              </div>
            </div>
          )}
          {importResult.errors?.length > 0 && (
            <div className="bg-danger-light border border-red-200 rounded-card p-3 mt-2">
              <div className="text-xs font-semibold text-danger mb-1">Errors:</div>
              <div className="text-xs text-danger">{importResult.errors.length} rows failed to import</div>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Member' : 'Add New Member'}>
        <form onSubmit={submit} className="px-5 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">First Name</label><input name="first_name" value={formData.first_name || ''} onChange={handleFormChange} required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Surname</label><input name="surname" value={formData.surname || ''} onChange={handleFormChange} required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Cell Number</label><input name="cell" value={formData.cell || ''} onChange={handleFormChange} required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Gender</label><select name="gender" value={formData.gender || ''} onChange={handleFormChange} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option><option>Male</option><option>Female</option></select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Age</label><input name="age" type="number" value={formData.age || ''} onChange={handleFormChange} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Birthday</label><input name="birthday" type="date" value={formData.birthday ? formData.birthday.slice(0,10) : ''} onChange={handleFormChange} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Province</label><select name="province" value={formData.province || ''} onChange={e => { handleFormChange(e); if (!editing) setFilters(f => ({ ...f, province: e.target.value })) }} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{provinces.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">City</label><select name="city" value={formData.city || ''} onChange={handleFormChange} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{(formData.province ? (citiesByProvince[formData.province] || []) : []).map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Church</label><ChurchInput name="church" defaultValue={formData.church || ''} province={formData.province} city={formData.city} onChange={(val) => setFormData(prev => ({ ...prev, church: val }))} /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Taskforce</label><select name="taskforce" value={formData.taskforce || ''} onChange={handleFormChange} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{taskforces.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Age Range</label><select name="age_range" value={formData.age_range || ''} onChange={handleFormChange} className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{ageRanges.map(a => <option key={a}>{a}</option>)}</select></div>
          </div>
          <div className="flex gap-2.5 mt-5">
            <button type="submit" className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">{editing ? 'Update' : 'Save'} Member</button>
            <button type="button" onClick={() => setModalOpen(false)} className="border border-green text-green rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
