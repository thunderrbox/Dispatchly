import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Instantiates resend conditionally
const resend = RESEND_API_KEY && RESEND_API_KEY !== 're_your_api_key' 
  ? new Resend(RESEND_API_KEY) 
  : null;

export async function sendStatusChangeEmail(
  orderId: string,
  oldStatus: string | null,
  newStatus: string,
  customerEmail: string,
  customerName: string
) {
  const oldStatusLabel = oldStatus || 'CREATED';
  const subject = `[Dispatchly] Shipment ${orderId.substring(0, 8)} Status Update: ${newStatus}`;
  
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
    if (!resend) {
      console.log(`[Notification STUB] Sending status change email to ${customerEmail}:`);
      console.log(`Subject: ${subject}`);
      console.log(`Change: ${oldStatusLabel} -> ${newStatus}`);
      return;
    }

    const { data, error } = await resend.emails.send({
      from: 'Dispatchly Tracker <onboarding@resend.dev>', // Resend free tier sandbox domain
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
    // Fail silently so email delivery issues don't crash core delivery transitions
    console.error('Silently caught notification mail delivery failure:', error);
  }
}
