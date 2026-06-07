import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

  function calcAge(birthday) {
    if (!birthday) return '-';
    const today = new Date();
    const birth = new Date(birthday);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

export default function MessageLog() {
  const queryClient = useQueryClient()
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [editRow, setEditRow] = useState(null)

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => (await api.get('/messages/campaigns')).data,
  })

  const { data: campaignDetail } = useQuery({
    queryKey: ['campaignLog', selectedCampaign],
    queryFn: async () => {
      const res = await api.get(`/messages/campaigns/${selectedCampaign}/log`)
      return res.data
    },
    enabled: !!selectedCampaign,
  })

  const updateMemberMutation = useMutation({
    mutationFn: (data) => api.put(`/members/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignLog', selectedCampaign] })
      setEditRow(null)
    },
  })

  const handleSort = (key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const getSortVal = (row, key) => {
    if (key === 'name') return `${row.first_name || ''} ${row.surname || ''}`.trim().toLowerCase()
    if (key === 'age') return calcAge(row.birthday)
    return String(row[key] || '').toLowerCase()
  }

  const sortedLogs = campaignDetail?.logs ? [...campaignDetail.logs].sort((a, b) => {
    const aVal = getSortVal(a, sort.key)
    const bVal = getSortVal(b, sort.key)
    if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1
    return 0
  }) : []

  return (
    <div>
      <div className="bg-white rounded-card border border-border shadow-card">
        <div className="px-5 py-4 border-b border-border"><div className="font-inter font-bold text-[15px]">Message History</div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left">
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Event</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Audience</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Sent</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Delivered</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Bounced / Flagged</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns?.map(c => (
                <tr key={c.id} className="border-b border-surface2 hover:bg-surface cursor-pointer" onClick={() => setSelectedCampaign(c.id)}>
                  <td className="px-4 py-3">{new Date(c.sent_at).toLocaleDateString('en-ZA')}</td>
                  <td className="px-4 py-3">{c.event_title || 'None'}</td>
                  <td className="px-4 py-3">{c.audience_filter ? JSON.stringify(c.audience_filter) : 'All Members'}</td>
                  <td className="px-4 py-3">{c.sent_count || '-'}</td>
                  <td className="px-4 py-3"><span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-light text-green">{c.delivered || '-'}</span></td>
                  <td className="px-4 py-3"><span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-danger-light text-danger">{c.bounced || '-'}</span></td>
                  <td className="px-4 py-3"><button className="text-green text-xs font-medium underline">View log</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCampaign && campaignDetail && (
        <div className="bg-white rounded-card border border-border shadow-card mt-5">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="font-inter font-bold text-[15px]">Campaign Details</div>
            <button onClick={() => setSelectedCampaign(null)} className="text-text-muted text-sm">Close</button>
          </div>
          <div className="px-5 py-3 bg-surface border-b border-border text-sm">
            Sent: <strong className="text-green">{campaignDetail.stats?.sent || 0}</strong>
            <span className="ml-4">Bounced: <strong className="text-danger">{campaignDetail.stats?.bounced || 0}</strong></span>
            <span className="ml-4">Flagged: <strong className="text-gold">{campaignDetail.stats?.flagged || 0}</strong></span>
            <div className="text-xs text-text-muted mt-1">Sorting by: <strong className="text-green">{sort.key}</strong> ({sort.dir === 'asc' ? 'ascending' : 'descending'})</div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide"><button onClick={() => handleSort('name')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Name {sort.key === 'name' && (sort.dir === 'asc' ? '▲' : '▼')}</button></th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide"><button onClick={() => handleSort('cell')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Phone {sort.key === 'cell' && (sort.dir === 'asc' ? '▲' : '▼')}</button></th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide"><button onClick={() => handleSort('city')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">City {sort.key === 'city' && (sort.dir === 'asc' ? '▲' : '▼')}</button></th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide"><button onClick={() => handleSort('province')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Province {sort.key === 'province' && (sort.dir === 'asc' ? '▲' : '▼')}</button></th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide"><button onClick={() => handleSort('church')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Church {sort.key === 'church' && (sort.dir === 'asc' ? '▲' : '▼')}</button></th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide"><button onClick={() => handleSort('age')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Age {sort.key === 'age' && (sort.dir === 'asc' ? '▲' : '▼')}</button></th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide"><button onClick={() => handleSort('status')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Status {sort.key === 'status' && (sort.dir === 'asc' ? '▲' : '▼')}</button></th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map(l => {
                  const isEditing = editRow === l.member_id
                  return (
                    <tr key={l.id} className={`border-b border-surface2 ${isEditing ? 'bg-green-light/30' : ''}`}>
                      {isEditing ? (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <input id={`fn-${l.member_id}`} defaultValue={l.first_name} className="w-full bg-transparent border-b border-green text-[13px] outline-none" />
                              <input id={`sn-${l.member_id}`} defaultValue={l.surname} className="w-full bg-transparent border-b border-green text-[13px] outline-none" />
                            </div>
                          </td>
                          <td className="px-4 py-3"><input id={`cell-${l.member_id}`} defaultValue={l.cell} className="w-full bg-transparent border-b border-green text-[13px] outline-none" /></td>
                          <td className="px-4 py-3"><input id={`city-${l.member_id}`} defaultValue={l.city || ''} className="w-full bg-transparent border-b border-green text-[13px] outline-none" /></td>
                          <td className="px-4 py-3"><input id={`prov-${l.member_id}`} defaultValue={l.province || ''} className="w-full bg-transparent border-b border-green text-[13px] outline-none" /></td>
                          <td className="px-4 py-3"><input id={`church-${l.member_id}`} defaultValue={l.church || ''} className="w-full bg-transparent border-b border-green text-[13px] outline-none" /></td>
                          <td className="px-4 py-3"><input id={`bd-${l.member_id}`} type="date" defaultValue={l.birthday ? l.birthday.split('T')[0] : ''} className="w-full bg-transparent border-b border-green text-[13px] outline-none" /></td>
                          <td className="px-4 py-3">
                            {l.status === 'sent' ? <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-light text-green">Sent</span>
                              : l.status === 'bounced' ? <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-danger-light text-danger">Bounced</span>
                              : <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gold-light text-gold">Flagged</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => {
                              updateMemberMutation.mutate({
                                id: l.member_id,
                                first_name: document.getElementById(`fn-${l.member_id}`).value,
                                surname: document.getElementById(`sn-${l.member_id}`).value,
                                cell: document.getElementById(`cell-${l.member_id}`).value,
                                city: document.getElementById(`city-${l.member_id}`).value,
                                province: document.getElementById(`prov-${l.member_id}`).value,
                                church: document.getElementById(`church-${l.member_id}`).value,
                                birth_date: document.getElementById(`bd-${l.member_id}`).value || null,
                              })
                            }} className="text-green text-xs font-medium underline">Save</button>
                            <button onClick={() => setEditRow(null)} className="text-danger text-xs font-medium underline ml-2">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">{l.first_name} {l.surname}</td>
                          <td className="px-4 py-3">{l.cell}</td>
                          <td className="px-4 py-3">{l.city || '-'}</td>
                          <td className="px-4 py-3">{l.province || '-'}</td>
                          <td className="px-4 py-3">{l.church || '-'}</td>
                          <td className="px-4 py-3">{calcAge(l.birthday)}</td>
                          <td className="px-4 py-3">
                            {l.status === 'sent' ? <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-light text-green">Sent</span>
                              : l.status === 'bounced' ? <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-danger-light text-danger">Bounced</span>
                              : <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gold-light text-gold">Flagged</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setEditRow(l.member_id)} className="text-green text-xs font-medium underline">Edit</button>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
