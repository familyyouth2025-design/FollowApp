import React, { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import api from '../api'
import Modal from '../components/Modal'
import ChurchInput from '../components/ChurchInput'
import { provinces } from '../data/sa-data'

export default function Admins() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data.admin,
  })
  const { data: admins } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => (await api.get('/admins')).data,
  })

  const addMutation = useMutation({
    mutationFn: (data) => api.post('/admins', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admins'] }); setModalOpen(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admins/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admins'] }),
  })

  const isSuper = me?.role === 'super_admin'

  const submit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd)
    addMutation.mutate(data)
  }

  return (
    <div>
      <div className="bg-white rounded-card border border-border shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-inter font-bold text-[15px]">Admins</div>
          {isSuper && <button onClick={() => setModalOpen(true)} className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">+ Add Admin</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left">
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Cell</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Province</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">City</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Church</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins?.map(a => (
                <tr key={a.id} className="border-b border-surface2 hover:bg-surface">
                  <td className="px-4 py-3 font-semibold">{a.first_name} {a.surname}</td>
                  <td className="px-4 py-3">{a.cell}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">{a.province}</td>
                  <td className="px-4 py-3">{a.city}</td>
                  <td className="px-4 py-3">{a.church}</td>
                  <td className="px-4 py-3">
                    {a.role === 'super_admin' ? <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gold-light text-gold">⭐ Super Admin</span>
                      : <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-light text-green">Admin</span>}
                  </td>
                  <td className="px-4 py-3">
                    {a.role !== 'super_admin' && isSuper ? (
                      <button onClick={() => deleteMutation.mutate(a.id)} className="bg-danger-light text-danger rounded-md px-2.5 py-1 text-xs font-medium">Remove</button>
                    ) : (
                      <span className="text-text-muted text-xs">Owner</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Admin">
        <form onSubmit={submit} className="px-5 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">First Name</label><input name="first_name" required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Surname</label><input name="surname" required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Cell Number</label><input name="cell" required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Email</label><input name="email" type="email" required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Password</label><input name="password" type="password" required className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Role</label><select name="role" className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Province</label><select name="province" className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"><option value="">Select...</option>{provinces.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">City</label><input name="city" className="px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green" /></div>
            <div className="col-span-2 flex flex-col gap-1.5"><label className="text-xs font-medium text-text-muted uppercase tracking-wide">Church</label><ChurchInput name="church" /></div>
          </div>
          <div className="flex gap-2.5 mt-5">
            <button type="submit" className="bg-green text-white rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-[#155d38]">Save Admin</button>
            <button type="button" onClick={() => setModalOpen(false)} className="border border-green text-green rounded-[7px] px-4 py-2 text-[13px] font-medium hover:bg-green hover:text-white transition-all">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
