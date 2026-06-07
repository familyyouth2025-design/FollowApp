import React from 'react'

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[14px] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="font-inter font-bold text-base">{title}</h3>
          <button onClick={onClose} className="text-text-muted text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
