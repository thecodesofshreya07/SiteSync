import 'dotenv/config'
import { sendEmail } from './services/emailService.js'

async function testBrevoDirectly() {
  console.log('--- TESTING BREVO TRANSACTIONAL EMAIL DISPATCH ---')
  console.log('Sender Email:', process.env.BREVO_SENDER_EMAIL)
  console.log('Sender Name:', process.env.BREVO_SENDER_NAME)
  console.log('API Key Present:', Boolean(process.env.BREVO_API_KEY))
  console.log('Target Email:', 'mirlubaib51005@gmail.com')

  const res = await sendEmail({
    to: 'mirlubaib51005@gmail.com',
    toName: 'Project Manager (Mir Lubaib)',
    subject: 'SiteSync Diagnostic Test Alert - Real-Time Telemetry',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
        <h2 style="color: #0f766e;">SiteSync Live Brevo Verification</h2>
        <p>This is a live diagnostic verification email from your SiteSync deployment.</p>
        <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #0f766e; margin: 15px 0;">
          <strong>Alert Test:</strong> Inventory telemetry and autonomous agent online.<br/>
          <strong>Timestamp:</strong> ${new Date().toISOString()}
        </div>
      </div>
    `,
    textContent: 'SiteSync Diagnostic Test Alert - Real-Time Telemetry',
  })

  console.log('Brevo Result:', res)
}

testBrevoDirectly().catch(console.error)
