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
  
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #E8622C; margin-bottom: 20px;">Dispatchly Delivery Tracker</h2>
      <p style="color: #334155; font-size: 15px;">Hello ${customerName},</p>
      <p style="color: #475569; font-size: 14px;">Your package status has been updated.</p>
      
      <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Shipment ID:</strong> ${orderId}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #334155;">
          <strong>Status Change:</strong> 
          <span style="color: #ef4444; text-decoration: line-through;">${oldStatusLabel}</span> → 
          <span style="color: #10b981; font-weight: bold;">${newStatus}</span>
        </p>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">You can track the full timeline of your delivery at any time via your Dispatchly Portal.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
      <p style="font-size: 11px; color: #94a3b8;">This is an automated delivery update. Please do not reply directly to this email.</p>
    </div>
  `;

  try {
    if (!resend) {
      console.log(`[Notification STUB] Status email to ${customerEmail} (Status: ${newStatus})`);
      return;
    }

    await resend.emails.send({
      from: 'Dispatchly Tracker <onboarding@resend.dev>',
      to: customerEmail,
      subject: subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Silently caught notification mail delivery failure:', error);
  }
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  username: string,
  role: string
) {
  const subject = `[Dispatchly] Welcome to Dispatchly! Account Created Successfully`;
  
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #E8622C; margin-bottom: 16px;">Welcome to Dispatchly Logistics!</h2>
      <p style="color: #334155; font-size: 15px;">Hello ${userName},</p>
      <p style="color: #475569; font-size: 14px;">Your account has been created successfully. Below are your account details:</p>
      
      <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Full Name:</strong> ${userName}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Username:</strong> ${username}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Email:</strong> ${userEmail}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Role:</strong> <span style="color: #E8622C; font-weight: bold;">${role}</span></p>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">You can log in to your account anytime using your email address or username.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
      <p style="font-size: 11px; color: #94a3b8;">Dispatchly Logistics Platform &copy; 2026</p>
    </div>
  `;

  try {
    if (!resend) {
      console.log(`[Notification STUB] Welcome email to ${userEmail} (${userName})`);
      return;
    }

    await resend.emails.send({
      from: 'Dispatchly Tracker <onboarding@resend.dev>',
      to: userEmail,
      subject: subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Silently caught welcome mail delivery failure:', error);
  }
}

export async function sendOrderCreatedEmail(
  orderId: string,
  customerEmail: string,
  customerName: string,
  finalAmount: number,
  paymentType: string,
  pickupAddress: string,
  dropAddress: string
) {
  const subject = `[Dispatchly] Order Placed & Payment Confirmed (${orderId.substring(0, 8)})`;
  
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #E8622C; margin-bottom: 16px;">Shipment & Payment Confirmation</h2>
      <p style="color: #334155; font-size: 15px;">Hello ${customerName},</p>
      <p style="color: #475569; font-size: 14px;">Your order has been successfully created and queued for dispatch.</p>
      
      <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Pickup Address:</strong> ${pickupAddress}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Delivery Address:</strong> ${dropAddress}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Payment Type:</strong> ${paymentType}</p>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #E8622C;"><strong>Total Amount:</strong> ₹${finalAmount.toFixed(2)}</p>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">You will receive automated delivery notifications as your shipment moves to pickup and delivery.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
      <p style="font-size: 11px; color: #94a3b8;">Dispatchly Logistics Platform &copy; 2026</p>
    </div>
  `;

  try {
    if (!resend) {
      console.log(`[Notification STUB] Order Created email to ${customerEmail} (Order: ${orderId})`);
      return;
    }

    await resend.emails.send({
      from: 'Dispatchly Tracker <onboarding@resend.dev>',
      to: customerEmail,
      subject: subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Silently caught order creation mail delivery failure:', error);
  }
}

export async function sendLoginNotificationEmail(
  userEmail: string,
  userName: string,
  role: string
) {
  const subject = `[Dispatchly] New Login Alert: Account Access Detected`;
  const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #E8622C; margin-bottom: 16px;">Security Alert: Account Login Detected</h2>
      <p style="color: #334155; font-size: 15px;">Hello ${userName},</p>
      <p style="color: #475569; font-size: 14px;">Your Dispatchly account was accessed successfully.</p>
      
      <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Account:</strong> ${userEmail}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Account Role:</strong> <span style="color: #E8622C; font-weight: bold;">${role}</span></p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Login Time (IST):</strong> ${timeStr}</p>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">If this was you, no action is needed. If you did not log in, please change your password immediately.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
      <p style="font-size: 11px; color: #94a3b8;">Dispatchly Logistics Security Platform &copy; 2026</p>
    </div>
  `;

  try {
    if (!resend) {
      console.log(`[Notification STUB] Login alert email to ${userEmail} (${userName}, Role: ${role})`);
      return;
    }

    await resend.emails.send({
      from: 'Dispatchly Security <onboarding@resend.dev>',
      to: userEmail,
      subject: subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Silently caught login mail delivery failure:', error);
  }
}

export async function sendAdminAlertEmail(
  actionType: 'REGISTER' | 'LOGIN',
  userEmail: string,
  userName: string,
  role: string
) {
  const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'abhijeet.s.r.cse@gmail.com';
  const subject = `[Dispatchly Admin Alert] User ${actionType === 'REGISTER' ? 'Registration' : 'Login'} (${role}): ${userName}`;
  const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #E8622C; margin-bottom: 16px;">Dispatchly System Admin Audit Alert</h2>
      <p style="color: #334155; font-size: 15px;">Main Admin Notification,</p>
      <p style="color: #475569; font-size: 14px;">A user has performed a <strong>${actionType}</strong> action on Dispatchly.</p>
      
      <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Action:</strong> <span style="color: #10B981; font-weight: bold;">${actionType}</span></p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>User Name:</strong> ${userName}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Email:</strong> ${userEmail}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Category Role:</strong> <span style="color: #E8622C; font-weight: bold;">${role}</span></p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #334155;"><strong>Timestamp:</strong> ${timeStr}</p>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">This log is automatically dispatched to the main system administrator account.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
      <p style="font-size: 11px; color: #94a3b8;">Dispatchly Logistics System Audit &copy; 2026</p>
    </div>
  `;

  try {
    if (!resend) {
      console.log(`[Notification STUB] Main Admin Alert (${actionType}) to ${adminEmail} for ${userEmail} (${role})`);
      return;
    }

    await resend.emails.send({
      from: 'Dispatchly Admin System <onboarding@resend.dev>',
      to: adminEmail,
      subject: subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Silently caught admin alert mail delivery failure:', error);
  }
}
