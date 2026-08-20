import { useState } from 'react'
import { QrCode, Printer, Check, Copy, PackagePlus, ArrowRight } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Badge from '../common/Badge'

export default function QRCodeModal({ item, open, onClose, onQuickLog }) {
  const [copied, setCopied] = useState(false)

  if (!item) return null

  // Generate a standard SVG QR Code URL using standard qr service or data
  const qrData = JSON.stringify({
    system: 'SiteSync',
    id: item.id,
    item: item.item,
    siteId: item.siteId,
  })

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`

  const handleCopy = () => {
    navigator.clipboard?.writeText(item.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Material QR Label: ${item.id}`}>
      <div className="space-y-5 font-public">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6 text-center shadow-inner">
          <div className="rounded-lg bg-white p-3 shadow-md border border-slate-200">
            <img
              src={qrImageUrl}
              alt={`QR Code for ${item.item}`}
              className="h-44 w-44 object-contain"
            />
          </div>

          <p className="mt-3 text-sm font-bold text-slate-900">{item.item}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone="teal">{item.id}</Badge>
            <span className="text-xs font-semibold text-slate-500 font-ibm">
              Current: {item.quantity} {item.unit}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-ibm">
            Scan with any mobile camera or field scanner to verify stock & log transactions
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-border">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied ID' : 'Copy ID'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer size={14} />
              <span>Print Label</span>
            </button>
          </div>

          {onQuickLog && (
            <Button
              variant="primary"
              size="sm"
              icon={PackagePlus}
              onClick={() => {
                onClose()
                onQuickLog(item)
              }}
            >
              Quick Log Stock
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
