import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api'

function levenshtein(a, b) {
  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
    }
  }
  return matrix[b.length][a.length]
}

function fuzzyMatch(query, options) {
  if (!query) return []
  const q = query.toLowerCase().trim()
  return options
    .map(opt => {
      const name = opt.name.toLowerCase()
      const dist = levenshtein(q, name)
      const maxLen = Math.max(q.length, name.length)
      const score = maxLen === 0 ? 0 : dist / maxLen
      return { ...opt, score }
    })
    .filter(o => o.score < 0.5 || o.name.toLowerCase().includes(q))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
}

export default function ChurchInput({ name, defaultValue, province, city, onChange }) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(defaultValue || '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [matches, setMatches] = useState([])
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  const { data: churches } = useQuery({
    queryKey: ['churches'],
    queryFn: async () => (await api.get('/churches')).data,
  })

  // Filter churches by province if provided
  const filteredChurches = React.useMemo(() => {
    if (!churches) return []
    if (!province) return churches
    return churches.filter(c => c.province === province)
  }, [churches, province])

  useEffect(() => {
    if (value && filteredChurches) {
      const m = fuzzyMatch(value, filteredChurches)
      setMatches(m)
      setShowDropdown(m.length > 0 || value.length > 0)
    } else {
      setShowDropdown(false)
    }
  }, [value, filteredChurches])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const createChurchMutation = useMutation({
    mutationFn: (data) => api.post('/churches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churches'] })
    },
  })

  const handleSelect = (churchName) => {
    setValue(churchName)
    setShowDropdown(false)
    if (onChange) onChange(churchName)
  }

  const handleCreateNew = async () => {
    if (!value.trim()) return
    await createChurchMutation.mutateAsync({
      name: value.trim(),
      province: province || null,
      city: city || null,
    })
    setShowDropdown(false)
    if (onChange) onChange(value.trim())
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        name={name}
        value={value}
        onChange={e => { setValue(e.target.value); if (onChange) onChange(e.target.value) }}
        onFocus={() => {
          if (value && filteredChurches) {
            const m = fuzzyMatch(value, filteredChurches)
            setMatches(m)
            setShowDropdown(true)
          }
        }}
        className="w-full px-3 py-2.5 border-[1.5px] border-border rounded-lg text-sm outline-none focus:border-green"
        placeholder="Type church name..."
        autoComplete="off"
      />
      {showDropdown && (
        <div className="absolute z-50 w-full bg-white border border-border rounded-lg shadow-card mt-1 max-h-48 overflow-y-auto">
          {matches.length > 0 && matches.map(m => (
            <div
              key={m.id}
              onClick={() => handleSelect(m.name)}
              className="px-3 py-2 text-sm hover:bg-surface cursor-pointer"
            >
              {m.name} {m.city ? `(${m.city})` : ''}
            </div>
          ))}
          {matches.length === 0 && value.trim() && (
            <div className="px-3 py-2 text-xs text-text-muted">No matching churches found</div>
          )}
          <div
            onClick={handleCreateNew}
            className="px-3 py-2 text-xs text-green font-medium hover:bg-surface cursor-pointer border-t border-border"
          >
            + Use "{value}" as new church
          </div>
        </div>
      )}
    </div>
  )
}
