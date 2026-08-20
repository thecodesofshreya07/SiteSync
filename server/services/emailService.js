import { config } from '../config.js'

const fetchFn = typeof fetch !== 'undefined' ? fetch : global.fetch

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

/**
 * Send transactional email using Brevo SMTP API.
 * Wrapped in non-blocking try/catch so email failures never block core database workflows.
 */
export async function sendEmail({ to, toName, subject, htmlContent, textContent }) {
  const apiKey = process.env.BREVO_API_KEY || config?.brevoApiKey || ''
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'devsupport007@gmail.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'SiteSync Construction Ops'

  if (!apiKey || apiKey.includes('placeholder')) {
    console.warn('[EMAIL] Brevo API Key not configured. Skipping email to:', to)
    return { success: false, reason: 'MISSING_API_KEY' }
  }

  if (!to || !to.includes('@')) {
    console.warn('[EMAIL] Invalid recipient email:', to)
    return { success: false, reason: 'INVALID_RECIPIENT' }
  }

  try {
    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: to,
          name: toName || to.split('@')[0],
        },
      ],
      subject,
      htmlContent: htmlContent || `<p>${textContent || ''}</p>`,
    }

    if (textContent) {
      payload.textContent = textContent
    }

    const response = await fetchFn(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.warn(`[EMAIL] Brevo API rejected email (HTTP ${response.status}):`, errText)
      return { success: false, error: errText }
    }

    const resJson = await response.json()
    console.log(`[EMAIL] Transactional email sent to ${to} (MessageId: ${resJson.messageId})`)
    return { success: true, messageId: resJson.messageId }
  } catch (err) {
    console.warn('[EMAIL] Failed to send email via Brevo:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Phase 2 Helper: Send AI Budget Overrun Rejection Notification to Finance Manager
 */
export async function sendPORejectionEmail({ financeEmail, po, site, reasoningSummary }) {
  const targetEmail = financeEmail || 'shreyamishra22042007@gmail.com'
  const siteName = site?.name || site?.id || 'Project Site'
  const siteId = site?.id || 'SITE'
  const subject = `[BUDGET ALERT] PO ${po.id} Auto-Rejected by AI for ${siteName}`

  const nowFormatted = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const planned = Number(site?.budgetPlanned || site?.budget_planned || 0)
  const actual = Number(site?.budgetActual || site?.budget_actual || 0)
  const poAmount = Number(po.amount || 0)
  const projectedTotal = actual + poAmount
  const overrunAmount = projectedTotal - planned
  const overrunPct = planned > 0 ? (((projectedTotal / planned) - 1) * 100).toFixed(1) : '0'

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a; line-height: 1.6; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; background-color: #ffffff;">
      <!-- Header -->
      <div style="background-color: #0f172a; padding: 22px 28px; color: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">SiteSync Operations</h2>
          <span style="background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 4px; text-transform: uppercase;">
            BUDGET OVERRUN INTERCEPT
          </span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Autonomous Financial Governance & Audit Dispatch</p>
      </div>

      <!-- Main Body -->
      <div style="padding: 28px;">
        <!-- Banner -->
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #991b1b;">AI Root Cause Diagnosis</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #7f1d1d; line-height: 1.5;">${reasoningSummary}</p>
        </div>

        <!-- Metric Cards Grid -->
        <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 20px;">
          <tr>
            <td style="width: 50%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
              <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">PO Request Amount</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #dc2626;">₹${poAmount.toLocaleString('en-IN')}</p>
            </td>
            <td style="width: 50%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
              <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Projected Overrun</p>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #991b1b;">+${overrunPct}% (₹${Math.max(overrunAmount, 0).toLocaleString('en-IN')})</p>
            </td>
          </tr>
        </table>

        <!-- Details Table -->
        <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; font-weight: 700;">Audit Ledger Breakdown</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 26px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Purchase Order ID:</td>
            <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #0f172a;">${po.id}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Target Project Site:</td>
            <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #0f172a;">${siteName} (${siteId})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Material / Quantity:</td>
            <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #0f172a;">${po.item} (${po.quantity} ${po.unit || 'units'})</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Approved Budget Envelope:</td>
            <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #0f172a;">₹${planned.toLocaleString('en-IN')}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Spend Prior to this PO:</td>
            <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #0f172a;">₹${actual.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b;">Timestamp:</td>
            <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #64748b;">${nowFormatted}</td>
          </tr>
        </table>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0 16px 0;">
          <a href="http://localhost:5173/procurement" style="background-color: #0d9488; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);">
            Review & Authorize in Finance Portal →
          </a>
        </div>
        <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
          As Finance Manager, you may review this decision and either approve an executive override or formally confirm the rejection.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
        SiteSync Multi-Site Construction Platform · Automated Governance Engine · Bandra East, Mumbai
      </div>
    </div>
  `

  const textContent = `
[BUDGET ALERT] Purchase Order ${po.id} Auto-Rejected by AI
Project Site: ${siteName} (${siteId})
Timestamp: ${nowFormatted}

AI DIAGNOSIS:
${reasoningSummary}

DETAILS:
- Material: ${po.item} (${po.quantity} ${po.unit || 'units'})
- Order Amount: ₹${poAmount.toLocaleString('en-IN')}
- Planned Budget: ₹${planned.toLocaleString('en-IN')}
- Current Spend: ₹${actual.toLocaleString('en-IN')}
- Projected Overrun: +${overrunPct}%

Review and authorize at: http://localhost:5173/procurement
`

  return await sendEmail({
    to: targetEmail,
    toName: 'Finance Manager',
    subject,
    htmlContent,
    textContent,
  })
}

/**
 * Phase 3 Helper: Send Alert Notification Email to Project Manager
 */
export async function sendPMAlertEmail({ pmEmail, alert, site, reasoningSummary, recommendation }) {
  const targetEmail = pmEmail || 'mirlubaib51005@gmail.com'
  const siteName = site?.name || site?.id || alert?.siteId || 'SiteSync Site'
  const siteId = site?.id || alert?.siteId || 'SITE-001'
  const severity = (alert?.severity || 'warning').toUpperCase()
  const isCritical = severity === 'CRITICAL'

  const subject = `[${severity} ALERT] ${alert.title || 'Operational Shortage Detected'} · ${siteName}`

  const nowFormatted = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const reasonPoints = Array.isArray(alert.reasonPoints) && alert.reasonPoints.length > 0
    ? alert.reasonPoints
    : [alert.explanation || 'Real-time telemetry threshold exceeded.']

  const reasonListHtml = reasonPoints
    .map((p) => `<li style="margin-bottom: 6px; color: #334155; font-size: 13px;">${p}</li>`)
    .join('')

  const recText = recommendation || alert.recommendation || alert.recommendedAction || 'Review active operational logs and coordinate with site contractor.'

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #0f172a; line-height: 1.6; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; background-color: #ffffff;">
      <!-- Header -->
      <div style="background-color: #0f172a; padding: 22px 28px; color: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">SiteSync Operations</h2>
          <span style="background-color: ${isCritical ? '#dc2626' : '#d97706'}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 4px; text-transform: uppercase;">
            ${severity} ALERT
          </span>
        </div>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Autonomous Real-Time Site Telemetry Notification</p>
      </div>

      <!-- Main Body -->
      <div style="padding: 28px;">
        <!-- Alert Title Box -->
        <div style="background-color: ${isCritical ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${isCritical ? '#dc2626' : '#d97706'}; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: ${isCritical ? '#991b1b' : '#92400e'};">${alert.title}</h3>
          <p style="margin: 0; font-size: 13px; color: ${isCritical ? '#7f1d1d' : '#78350f'};">
            Project Site: <strong>${siteName} (${siteId})</strong> · Logged: <strong>${nowFormatted}</strong>
          </p>
        </div>

        <!-- AI Stated Reasoning -->
        <div style="margin-bottom: 22px;">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; font-weight: 700;">AI Telemetry Diagnosis</h4>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155; line-height: 1.5;">
            ${reasoningSummary || alert.explanation || 'Anomaly detected during continuous site monitoring cycle.'}
          </p>
          <ul style="margin: 0; padding-left: 20px;">
            ${reasonListHtml}
          </ul>
        </div>

        <!-- Recommended Action Box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin-bottom: 26px;">
          <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.5px;">Recommended Engineering Resolution</p>
          <p style="margin: 0; font-size: 15px; font-weight: 700; color: #14532d; line-height: 1.4;">${recText}</p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 28px 0 14px 0;">
          <a href="http://localhost:5173" style="background-color: #0f766e; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);">
            Open Project Manager Portal →
          </a>
        </div>
        <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
          Click to review telemetry sources, approve inter-site transfers, or expedite material orders.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
        SiteSync Multi-Site Construction Operations · Connected Field Telemetry · Mumbai
      </div>
    </div>
  `

  const textContent = `
[${severity} ALERT] ${alert.title}
Project: ${siteName} (${siteId})
Timestamp: ${nowFormatted}

AI TELEMETRY DIAGNOSIS:
${reasoningSummary || alert.explanation}

EVIDENCE POINTS:
${reasonPoints.map((p) => `• ${p}`).join('\n')}

RECOMMENDED ACTION:
${recText}

Review immediately in your dashboard: http://localhost:5173
`

  return await sendEmail({
    to: targetEmail,
    toName: 'Project Manager',
    subject,
    htmlContent,
    textContent,
  })
}
