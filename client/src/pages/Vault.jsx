import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import api from '../api'

export default function Vault() {
  const queryClient = useQueryClient()
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get('/events')).data,
  })
  const [eventId, setEventId] = useState('')

  const { data: files } = useQuery({
    queryKey: ['eventFiles', eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}/files`)
      return res.data
    },
    enabled: !!eventId,
  })

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await api.post(`/files/events/${eventId}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eventFiles', eventId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/files/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['eventFiles', eventId] }),
  })

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !eventId) return
    const fd = new FormData()
    fd.append('file', file)
    uploadMutation.mutate(fd)
    e.target.value = ''
  }

  const selectedEvent = events?.find(e => e.id === eventId)

  return (
    <div>
      <div className="bg-white rounded-card border border-border shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-inter font-bold text-[15px]">File Vault</div>
          <select value={eventId} onChange={e => setEventId(e.target.value)} className="px-3 py-2 border-[1.5px] border-border rounded-[7px] text-[13px] outline-none focus:border-green">
            <option value="">Select Event...</option>
            {events?.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {selectedEvent && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {files?.map(f => (
              <div key={f.id} className="border border-border rounded-lg p-4 text-center hover:bg-surface transition-colors relative group">
                <div className="text-4xl mb-2">{f.file_type?.startsWith('image') ? '🖼️' : '📄'}</div>
                <div className="text-[13px] font-medium truncate">{f.original_name}</div>
                <div className="text-[11px] text-text-muted">{new Date(f.uploaded_at).toLocaleDateString('en-ZA')}</div>
                <button onClick={() => deleteMutation.mutate(f.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-danger-light text-danger rounded px-2 py-0.5 text-[11px] font-medium transition-opacity">Remove</button>
              </div>
            ))}

            <label className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer text-text-muted hover:bg-surface transition-colors flex flex-col items-center justify-center">
              <div className="text-3xl mb-2">➕</div>
              <div className="text-[13px]">Upload File</div>
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        )}

        {!selectedEvent && (
          <div className="p-10 text-center text-text-muted text-sm">Select an event to view its files.</div>
        )}
      </div>
    </div>
  )
}
