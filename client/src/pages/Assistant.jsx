import { useState } from 'react'
import { Cpu, MessageSquare, Terminal, ShieldCheck, Play, CheckCircle2, Copy } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import AssistantChat from '../components/assistant/AssistantChat'
import Badge from '../components/common/Badge'
import { API_BASE } from '../lib/api'

export default function Assistant() {
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'mcp'
  const [testQuestion, setTestQuestion] = useState('What is the cement inventory level at Riverside Tower?')
  const [testSiteId, setTestSiteId] = useState('SITE-001')
  const [mcpResult, setMcpResult] = useState(null)
  const [mcpLoading, setMcpLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const runMcpTool = async () => {
    try {
      setMcpLoading(true)
      const res = await fetch(`${API_BASE}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testQuestion,
          question: testQuestion,
          siteId: testSiteId,
        }),
      })
      const data = await res.json()
      setMcpResult(data)
    } catch (err) {
      setMcpResult({ error: err.message })
    } finally {
      setMcpLoading(false)
    }
  }

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(mcpResult, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
        <PageHeader
          title="SiteSync Operational Intelligence"
          subtitle="Model Context Protocol (MCP) server & live multi-site RAG assistant."
        />

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-white p-1 shadow-2xs shrink-0 font-public">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare size={14} />
            AI Assistant Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'mcp'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu size={14} />
            MCP Protocol Inspector
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <AssistantChat />
      ) : (
        /* Clean MCP Protocol View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-public">
          {/* Left: Server Definition & Capabilities */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">sitesync-operations</h3>
                    <p className="text-2xs text-slate-500 font-ibm">MCP Server v1.0.0 · Stdio / REST</p>
                  </div>
                </div>
                <Badge tone="green" className="text-3xs uppercase font-ibm">
                  Active
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-semibold text-slate-700">Exposed MCP Tools</p>
                <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-900 text-2xs">queryOperationalData</span>
                    <span className="text-3xs bg-teal-200 text-teal-800 px-1.5 py-0.5 rounded font-semibold font-ibm">Tool</span>
                  </div>
                  <p className="mt-1 text-2xs text-teal-800 leading-relaxed font-ibm">
                    Query live construction telemetry across inventory, POs, deliveries, equipment, tasks, and budgets with verifiable citations.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-semibold text-slate-700">Exposed MCP Resources</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="font-mono font-bold text-slate-800 text-2xs">sitesync://sites</span>
                  <p className="mt-0.5 text-2xs text-slate-500 font-ibm">Live multi-site registry and active telemetry stream.</p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 flex items-start gap-2 font-ibm">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Standard Compliant</strong>: Implements official Model Context Protocol specifications (<code className="text-2xs">@modelcontextprotocol/sdk</code>).
                </span>
              </div>
            </div>
          </div>

          {/* Right: Live MCP Tool Invocation Tester */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Live MCP Tool Execution</h3>
                </div>
                <span className="text-2xs text-slate-500 font-ibm">JSON-RPC / REST Runner</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question (<code className="text-teal-600 text-2xs">question: string</code>)
                  </label>
                  <input
                    type="text"
                    value={testQuestion}
                    onChange={(e) => setTestQuestion(e.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-slate-50 px-3 py-2 text-xs text-slate-900 font-ibm focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Site Scope (<code className="text-teal-600 text-2xs">siteId: string (optional)</code>)
                  </label>
                  <select
                    value={testSiteId}
                    onChange={(e) => setTestSiteId(e.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-slate-50 px-3 py-2 text-xs text-slate-900 font-ibm focus:border-teal-500 focus:outline-none"
                  >
                    <option value="SITE-001">SITE-001 (Riverside Tower · Bandra)</option>
                    <option value="SITE-002">SITE-002 (Warehouse Expansion · Bhiwandi)</option>
                    <option value="SITE-003">SITE-003 (Metro Heights · Powai)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={runMcpTool}
                  disabled={mcpLoading}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                >
                  <Play size={14} />
                  {mcpLoading ? 'Executing queryOperationalData...' : 'Execute queryOperationalData Tool'}
                </button>
              </div>

              {/* Output Result */}
              {mcpResult && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-100 font-ibm text-xs space-y-2">
                  <div className="flex items-center justify-between text-2xs text-slate-400 border-b border-slate-800 pb-2">
                    <span className="font-mono text-teal-400">MCP Result Payload</span>
                    <button
                      type="button"
                      onClick={copyJson}
                      className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                    >
                      <Copy size={12} />
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto pr-1 space-y-2 text-slate-200">
                    <p className="text-slate-100 font-medium whitespace-pre-wrap">{mcpResult.answer || mcpResult.error}</p>
                    {Array.isArray(mcpResult.sources) && mcpResult.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-800 text-2xs text-slate-400">
                        <span className="font-semibold text-teal-400">Grounded Sources: </span>
                        {mcpResult.sources.map((s) => s.label || s.id).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
