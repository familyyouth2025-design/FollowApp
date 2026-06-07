import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login() {
  const [email, setEmail] = useState('symphonytone@gmail.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/login', { email, password })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#0f2818_0%,#1a4a2a_60%,#0d1f15_100%)]">
      <div className="bg-white rounded-2xl p-12 px-10 w-full max-w-[400px] shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
        <div className="font-inter font-extrabold text-[22px] text-green tracking-tight mb-1">SAYET Admin Portal</div>
        <div className="text-[13px] text-text-muted mb-8">SA Youth Economy Taskforce — Secure Access</div>
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-card text-[15px] outline-none focus:border-green mb-4"
            placeholder="admin@sayet.org"
          />
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-card text-[15px] outline-none focus:border-green mb-5"
            placeholder="••••••••"
          />
          {error && <div className="text-danger text-sm mb-3">{error}</div>}
          <button type="submit" className="w-full bg-green text-white rounded-card py-3.5 font-inter font-semibold text-[15px] hover:bg-[#155d38] transition-colors">
            Sign In
          </button>
        </form>
        <p className="text-xs text-text-muted text-center mt-4">Demo: symphonytone@gmail.com / password123</p>
      </div>
    </div>
  )
}
