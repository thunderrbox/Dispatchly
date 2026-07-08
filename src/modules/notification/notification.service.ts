import { Resend } from 'resend';

// Retrieve Resend API credentials from environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Conditional instantiation to support safe fallback logging when Resend keys are unconfigured
const resend = RESEND_API_KEY && RESEND_API_KEY !== 're_your_api_key' 
  ? new Resend(RESEND_API_KEY) 
  : null;

/**
 * Triggers an email status update notification using the Resend API SDK.
 * Falls back to console log stub outputs in local development when keys are unconfigured,
 * and handles delivery failures gracefully to ensure notification issues never block core database transactions.
 */
export async function sendStatusChangeEmail(
  orderId: string,
  oldStatus: string | null,
  newStatus: string,
  customerEmail: string,
  customerName: string
) {
  const oldStatusLabel = oldStatus || 'CREATED';
  const subject = `[Dispatchly] Shipment ${orderId.substring(0, 8)} Status Update: ${newStatus}`;
  
  // Format HTML email message structure
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Dispatchly Delivery Tracker</h2>
      <p>Hello ${customerName},</p>
      <p>Your package status has been updated.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Shipment ID:</strong> ${orderId}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #475569;">
          <strong>Status Change:</strong> 
          <span style="color: #ef4444; text-decoration: line-through;">${oldStatusLabel}</span> → 
          <span style="color: #10b981; font-weight: bold;">${newStatus}</span>
        </p>
      </div>
      
      <p style="font-size: 12px; color: #64748b;">You can track the full timeline of your delivery at any time via your Customer Portal.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
      <p style="font-size: 11px; color: #94a3b8;">This is an automated delivery update. Please do not reply directly to this email.</p>
    </div>
  `;

  try {
    // If Resend API Key is missing, print details to logs and exit
    if (!resend) {
      console.log(`[Notification STUB] Sending status change email to ${customerEmail}:`);
      console.log(`Subject: ${subject}`);
      console.log(`Change: ${oldStatusLabel} -> ${newStatus}`);
      return;
    }

    // Call Resend client to send email using sandbox onboarding address
    const { data, error } = await resend.emails.send({
      from: 'Dispatchly Tracker <onboarding@resend.dev>', // Resend sandbox requirement
      to: customerEmail,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API Error:', error);
    } else {
      console.log('Notification email sent successfully:', data?.id);
    }
  } catch (error) {
    // Fail silently so email delivery issues do not halt the caller transaction
    console.error('Silently caught notification mail delivery failure:', error);
  }
}
