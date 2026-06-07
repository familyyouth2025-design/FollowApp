import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import api from '../api'

export default function Contributions() {
  const queryClient = useQueryClient()
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data,
  })
  const [eventId, setEventId] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'member', dir: 'asc' })

  const selectedEvent = events?.find(e => e.id === eventId)

  const { data: contribData } = useQuery({
    queryKey: ['contributions', eventId],
    queryFn: async () => {
      const res = await api.get(`/contributions?event_id=${eventId}`)
      return res.data
    },
    enabled: !!eventId,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/contributions', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contributions', eventId] }),
  })

  const contributions = contribData?.contributions || []
  const total = contribData?.total || 0
  const target = selectedEvent?.target_amount || 0
  const remaining = target - total
  const pct = Math.round((total / (target || 1)) * 100)

  const filtered = contributions.filter(c => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      (c.first_name || '').toLowerCase().includes(term) ||
      (c.surname || '').toLowerCase().includes(term) ||
      (c.cell || '').toLowerCase().includes(term) ||
      (c.province || '').toLowerCase().includes(term) ||
      String(c.amount || '').includes(term)
    )
  })

  const getSortVal = (row, key) => {
    if (key === 'member') return `${row.first_name || ''} ${row.surname || ''}`.trim().toLowerCase()
    if (key === 'amount') return Number(row[key] || 0)
    return String(row[key] || '').toLowerCase()
  }

  const sorted = [...filtered].sort((a, b) => {
    const aVal = getSortVal(a, sort.key)
    const bVal = getSortVal(b, sort.key)
    if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1
    if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))
  }

  return (
    <div>
      <div className="bg-white rounded-card border border-border shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-inter font-bold text-[15px]">Event Contributions</div>
          <select value={eventId} onChange={e => setEventId(e.target.value)} className="px-3 py-2 border-[1.5px] border-border rounded-[7px] text-[13px] outline-none focus:border-green">
            <option value="">Select Event...</option>
            {events?.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {(!events || events.length === 0) && (
          <div className="p-8 text-center text-sm text-text-muted">
            No events found. <button onClick={() => window.location.href = '/events'} className="text-green underline">Create an event first →</button>
          </div>
        )}

        {events && events.length > 0 && !selectedEvent && (
          <div className="p-8 text-center text-sm text-text-muted">
            Select an event above to view and manage contributions.
          </div>
        )}

        {selectedEvent && (
          <>
            <div className="px-5 py-4 bg-surface border-b border-border">
              <span className="text-sm">Target: <strong>R{Number(target).toLocaleString()}</strong></span>
              <span className="text-sm text-green ml-4">Raised: <strong>R{Number(total).toLocaleString()}</strong></span>
              <span className="text-sm text-text-muted ml-4">Remaining: R{Number(remaining).toLocaleString()}</span>
              <div className="bg-surface2 rounded-full h-2.5 mt-2.5">
                <div className="h-2.5 rounded-full bg-green transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>

            <div className="px-5 py-3 border-b border-border">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, cell, province or amount..."
                className="w-full max-w-sm px-3 py-2 border-[1.5px] border-border rounded-[7px] text-[13px] outline-none focus:border-green"
              />
            </div>

            <div className="px-5 py-2 text-xs text-text-muted">
              Sorting by: <strong className="text-green">{sort.key}</strong> ({sort.dir === 'asc' ? 'ascending' : 'descending'}) — click any column header to sort
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                      <button onClick={() => handleSort('member')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Member {sort.key === 'member' && (sort.dir === 'asc' ? '▲' : '▼')}</button>
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                      <button onClick={() => handleSort('cell')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Cell {sort.key === 'cell' && (sort.dir === 'asc' ? '▲' : '▼')}</button>
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                      <button onClick={() => handleSort('province')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Province {sort.key === 'province' && (sort.dir === 'asc' ? '▲' : '▼')}</button>
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">
                      <button onClick={() => handleSort('amount')} className="hover:text-green cursor-pointer bg-transparent border-none p-0 font-semibold text-text-muted uppercase tracking-wide text-[11px]">Amount Contributed {sort.key === 'amount' && (sort.dir === 'asc' ? '▲' : '▼')}</button>
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Update Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-text-muted">
                        {search.trim() ? 'No members match your search.' : 'No contributions recorded yet for this event.'}
                      </td>
                    </tr>
                  )}
                  {sorted.map(c => (
                    <tr key={c.member_id} className="border-b border-surface2 hover:bg-surface">
                      <td className="px-4 py-3">{c.first_name} {c.surname}</td>
                      <td className="px-4 py-3">{c.cell}</td>
                      <td className="px-4 py-3">{c.province}</td>
                      <td className="px-4 py-3"><strong className={c.amount > 0 ? 'text-green' : 'text-text-muted'}>R{Number(c.amount).toLocaleString()}</strong></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 items-center">
                          <input id={`amt-${c.member_id}`} type="number" placeholder="R0" className="w-20 px-2 py-1.5 border-[1.5px] border-border rounded-md text-[13px] outline-none focus:border-green" />
                          <button onClick={() => {
                            const input = document.getElementById(`amt-${c.member_id}`)
                            const val = Number(input?.value)
                            if (!isNaN(val) && val > 0) {
                              const newAmount = (Number(c.amount) || 0) + val
                              updateMutation.mutate({ event_id: eventId, member_id: c.member_id, amount: newAmount })
                              input.value = ''
                            }
                          }} className="bg-green text-white rounded-md px-2.5 py-1.5 text-xs font-medium">Update</button>
                          <button onClick={() => {
                            const input = document.getElementById(`amt-${c.member_id}`)
                            const val = Number(input?.value)
                            if (!isNaN(val) && val > 0) {
                              const newAmount = Math.max(0, (Number(c.amount) || 0) - val)
                              updateMutation.mutate({ event_id: eventId, member_id: c.member_id, amount: newAmount })
                              input.value = ''
                            }
                          }} className="bg-danger text-white rounded-md px-2.5 py-1.5 text-xs font-medium">Minus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
