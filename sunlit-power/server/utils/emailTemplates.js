/**
 * Branded Email Templates for Sunlit Power Pvt Ltd
 * All transactional emails use a consistent design with company branding.
 */

const COMPANY = {
  name: 'Sunlit Power Pvt Ltd',
  email: 'info@arenq.co.in',
  phone: '+91 89562 25134',
  address: 'Laxmi Avenue, Commercial Building - B, Office No. B-503&504, Near Edenn Tower, Wakad, Pune, Maharashtra - 411057, India',
  portalUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

// ─── Base Layout Wrapper ────────────────────────────────────────────────────

const wrapInLayout = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%); padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:#F97316;font-size:22px;font-weight:800;letter-spacing:0.5px;">SUNLIT</span>
                    <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.5px;"> POWER</span>
                    <span style="color:#93C5FD;font-size:16px;font-weight:600;letter-spacing:0.5px;"> PVT LTD</span>
                  </td>
                </tr>
                <tr>
                  <td style="color:#93C5FD;font-size:11px;letter-spacing:1px;padding-top:4px;font-weight:600;">
                    SERVICE &amp; COMPLAINT PORTAL
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#64748b;line-height:1.6;">
                    <strong style="color:#1e293b;">${COMPANY.name}</strong><br/>
                    ${COMPANY.address}<br/>
                    📞 <a href="tel:+918956225134" style="color:#1D4ED8;text-decoration:none;">${COMPANY.phone}</a> &nbsp;|&nbsp;
                    ✉️ <a href="mailto:${COMPANY.email}" style="color:#1D4ED8;text-decoration:none;">${COMPANY.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size:11px;color:#94a3b8;padding-top:16px;border-top:1px solid #e2e8f0;margin-top:12px;">
                    © ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.<br/>
                    ISO 9001:2015 &amp; ISO 14001:2015 Certified Battery Manufacturer
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─── Reusable Components ────────────────────────────────────────────────────

const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 12px;font-size:13px;color:#64748b;font-weight:600;width:160px;border-bottom:1px solid #f1f5f9;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${value}</td>
  </tr>
`;

const detailsTable = (rows) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0;">
    ${rows}
  </table>
`;

const ctaButton = (text, url) => `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#1D4ED8;border-radius:8px;padding:12px 28px;">
        <a href="${url}" target="_blank" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">${text}</a>
      </td>
    </tr>
  </table>
`;

const statusBadge = (status) => {
  const colors = {
    'Submitted': { bg: '#dbeafe', text: '#1e40af' },
    'Assigned': { bg: '#fef3c7', text: '#92400e' },
    'In Progress': { bg: '#e0e7ff', text: '#3730a3' },
    'Resolved': { bg: '#dcfce7', text: '#166534' },
    'Closed': { bg: '#f1f5f9', text: '#475569' },
  };
  const c = colors[status] || { bg: '#f1f5f9', text: '#475569' };
  return `<span style="background-color:${c.bg};color:${c.text};padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">${status}</span>`;
};

// ─── Email Templates ────────────────────────────────────────────────────────

/**
 * Welcome email sent on user registration
 */
const welcomeEmail = ({ name, email, role }) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Welcome to ${COMPANY.name}! 🎉</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${name}</strong>, your account has been created successfully on our Battery Service & Complaint Portal.
    </p>

    ${detailsTable(
      infoRow('Name', name) +
      infoRow('Email', email) +
      infoRow('Account Type', roleLabel) +
      infoRow('Status', '<span style="color:#16a34a;font-weight:600;">Active ✓</span>')
    )}

    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      You can now log in to your dashboard to register batteries, raise complaints, and track service requests in real-time.
    </p>

    ${ctaButton('Go to Dashboard', COMPANY.portalUrl + '/login')}

    <p style="color:#94a3b8;font-size:12px;margin-top:16px;">
      If you did not create this account, please contact us immediately at <a href="mailto:${COMPANY.email}" style="color:#1D4ED8;">${COMPANY.email}</a>.
    </p>
  `;
  return {
    subject: `Welcome to ${COMPANY.name} – Account Created`,
    html: wrapInLayout('Welcome', body)
  };
};

/**
 * Admin-created user welcome email (includes temporary password)
 */
const adminCreatedUserEmail = ({ name, email, role, password }) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Your Account Has Been Created 🔑</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${name}</strong>, an administrator has created a <strong>${roleLabel}</strong> account for you on the ${COMPANY.name} Portal.
    </p>

    ${detailsTable(
      infoRow('Email', email) +
      infoRow('Temporary Password', `<code style="background:#fef3c7;padding:2px 8px;border-radius:4px;font-weight:700;">${password}</code>`) +
      infoRow('Role', roleLabel)
    )}

    <p style="color:#ef4444;font-size:13px;font-weight:600;">
      ⚠️ Please change your password after your first login for security.
    </p>

    ${ctaButton('Log In Now', COMPANY.portalUrl + '/login')}
  `;
  return {
    subject: `${COMPANY.name} – Your Account Credentials`,
    html: wrapInLayout('Account Created', body)
  };
};

/**
 * Complaint raised – sent to customer
 */
const complaintRaisedCustomerEmail = ({ name, complaintId, type, priority, batteryModel, description }) => {
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Complaint Registered Successfully ✅</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${name}</strong>, your complaint has been registered. Our team will review it and assign a technician shortly.
    </p>

    ${detailsTable(
      infoRow('Ticket ID', `<strong>${complaintId}</strong>`) +
      infoRow('Type', type) +
      infoRow('Priority', priority) +
      infoRow('Battery Model', batteryModel || 'N/A') +
      infoRow('Description', description?.substring(0, 150) + (description?.length > 150 ? '...' : ''))
    )}

    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      You can track your complaint status anytime from your dashboard or using the public tracker on our homepage.
    </p>

    ${ctaButton('Track Complaint', COMPANY.portalUrl + '/customer/dashboard')}
  `;
  return {
    subject: `Complaint ${complaintId} – Registered Successfully | ${COMPANY.name}`,
    html: wrapInLayout('Complaint Registered', body)
  };
};

/**
 * Complaint raised – notification to admin
 */
const complaintRaisedAdminEmail = ({ adminName, complaintId, customerName, customerEmail, type, priority }) => {
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">New Complaint Received 🔔</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${adminName}</strong>, a new complaint has been raised and requires attention.
    </p>

    ${detailsTable(
      infoRow('Ticket ID', `<strong>${complaintId}</strong>`) +
      infoRow('Customer', customerName) +
      infoRow('Customer Email', customerEmail) +
      infoRow('Type', type) +
      infoRow('Priority', priority)
    )}

    ${ctaButton('Review in Dashboard', COMPANY.portalUrl + '/admin/dashboard')}
  `;
  return {
    subject: `[Action Required] New Complaint ${complaintId} | ${COMPANY.name}`,
    html: wrapInLayout('New Complaint', body)
  };
};

/**
 * Technician assigned – sent to technician
 */
const technicianAssignedEmail = ({ techName, complaintId, customerName, customerPhone, customerAddress, type, priority }) => {
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">New Task Assigned 🔧</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${techName}</strong>, you have been assigned to a new service request.
    </p>

    ${detailsTable(
      infoRow('Ticket ID', `<strong>${complaintId}</strong>`) +
      infoRow('Customer', customerName) +
      infoRow('Phone', customerPhone || 'N/A') +
      infoRow('Address', customerAddress || 'N/A') +
      infoRow('Issue Type', type) +
      infoRow('Priority', priority)
    )}

    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Please review the complaint details and update the status as you progress.
    </p>

    ${ctaButton('View Assignment', COMPANY.portalUrl + '/technician/dashboard')}
  `;
  return {
    subject: `Task Assigned: ${complaintId} | ${COMPANY.name}`,
    html: wrapInLayout('Task Assigned', body)
  };
};

/**
 * Technician assigned – notification to customer
 */
const technicianAssignedCustomerEmail = ({ customerName, complaintId, techName, techPhone }) => {
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Technician Assigned to Your Complaint 👨‍🔧</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${customerName}</strong>, a service technician has been assigned to your complaint.
    </p>

    ${detailsTable(
      infoRow('Ticket ID', `<strong>${complaintId}</strong>`) +
      infoRow('Technician', techName) +
      infoRow('Contact', techPhone || 'Will contact you directly')
    )}

    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Our technician will reach out to you to schedule the service visit. You can track updates from your dashboard.
    </p>

    ${ctaButton('Track Complaint', COMPANY.portalUrl + '/customer/dashboard')}
  `;
  return {
    subject: `Technician Assigned for ${complaintId} | ${COMPANY.name}`,
    html: wrapInLayout('Technician Assigned', body)
  };
};

/**
 * Status update – sent to customer
 */
const statusUpdateEmail = ({ customerName, complaintId, oldStatus, newStatus, note }) => {
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Complaint Status Updated 📋</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${customerName}</strong>, there's an update on your complaint.
    </p>

    ${detailsTable(
      infoRow('Ticket ID', `<strong>${complaintId}</strong>`) +
      infoRow('New Status', statusBadge(newStatus)) +
      (note ? infoRow('Note', note) : '')
    )}

    ${ctaButton('View Details', COMPANY.portalUrl + '/customer/dashboard')}
  `;
  return {
    subject: `Complaint ${complaintId} – Status: ${newStatus} | ${COMPANY.name}`,
    html: wrapInLayout('Status Update', body)
  };
};

/**
 * Complaint resolved – sent to customer (with feedback request)
 */
const complaintResolvedEmail = ({ customerName, complaintId }) => {
  const body = `
    <h2 style="color:#16a34a;font-size:20px;margin:0 0 8px;">Complaint Resolved ✅</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${customerName}</strong>, great news! Your complaint <strong>${complaintId}</strong> has been resolved by our service team.
    </p>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#166534;font-size:14px;margin:0;font-weight:600;">
        🌟 We'd love to hear your feedback!
      </p>
      <p style="color:#15803d;font-size:13px;margin:8px 0 0;">
        Please take a moment to rate our service. Your feedback helps us improve.
      </p>
    </div>

    ${ctaButton('Submit Feedback', COMPANY.portalUrl + '/customer/dashboard')}

    <p style="color:#94a3b8;font-size:12px;margin-top:16px;">
      If the issue persists, you can reopen or escalate the complaint from your dashboard.
    </p>
  `;
  return {
    subject: `Complaint ${complaintId} – Resolved! | ${COMPANY.name}`,
    html: wrapInLayout('Complaint Resolved', body)
  };
};

/**
 * Priority escalated – sent to customer
 */
const priorityEscalatedEmail = ({ customerName, complaintId, newPriority }) => {
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Priority Escalated ⚡</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${customerName}</strong>, the priority of your complaint has been escalated for faster resolution.
    </p>

    ${detailsTable(
      infoRow('Ticket ID', `<strong>${complaintId}</strong>`) +
      infoRow('New Priority', `<span style="color:#dc2626;font-weight:700;">${newPriority}</span>`)
    )}

    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Our team will prioritize this case accordingly. You will receive updates as progress is made.
    </p>

    ${ctaButton('View Complaint', COMPANY.portalUrl + '/customer/dashboard')}
  `;
  return {
    subject: `Complaint ${complaintId} – Priority Escalated to ${newPriority} | ${COMPANY.name}`,
    html: wrapInLayout('Priority Escalated', body)
  };
};

/**
 * Complaint closed – sent to customer
 */
const complaintClosedEmail = ({ customerName, complaintId }) => {
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Complaint Closed 📁</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${customerName}</strong>, your complaint <strong>${complaintId}</strong> has been closed and archived.
    </p>

    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Thank you for choosing ${COMPANY.name}. If you need any further assistance, feel free to raise a new complaint or contact our support team.
    </p>

    ${ctaButton('Go to Dashboard', COMPANY.portalUrl + '/customer/dashboard')}
  `;
  return {
    subject: `Complaint ${complaintId} – Closed | ${COMPANY.name}`,
    html: wrapInLayout('Complaint Closed', body)
  };
};

/**
 * Feedback received – confirmation to customer
 */
const feedbackReceivedEmail = ({ customerName, complaintId, serviceRating, techRating }) => {
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Thank You for Your Feedback! 🙏</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${customerName}</strong>, thank you for taking the time to share your experience.
    </p>

    ${detailsTable(
      infoRow('Ticket ID', `<strong>${complaintId}</strong>`) +
      infoRow('Service Rating', `<span style="color:#F97316;font-size:16px;">${stars(serviceRating)}</span> (${serviceRating}/5)`) +
      infoRow('Technician Rating', `<span style="color:#F97316;font-size:16px;">${stars(techRating)}</span> (${techRating}/5)`)
    )}

    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Your feedback is invaluable and helps us improve our service quality across all regions.
    </p>
  `;
  return {
    subject: `Feedback Received for ${complaintId} | ${COMPANY.name}`,
    html: wrapInLayout('Feedback Received', body)
  };
};

/**
 * Password reset email (replacing the inline HTML in authController)
 */
const passwordResetEmail = ({ name, resetLink }) => {
  const body = `
    <h2 style="color:#1e293b;font-size:20px;margin:0 0 8px;">Password Reset Request 🔐</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${name}</strong>, we received a request to reset your password.
    </p>

    <p style="color:#64748b;font-size:14px;line-height:1.6;">
      Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
    </p>

    ${ctaButton('Reset Password', resetLink)}

    <p style="color:#94a3b8;font-size:12px;margin-top:16px;">
      If you didn't request this, please ignore this email. Your password will remain unchanged.
    </p>
  `;
  return {
    subject: `Password Reset Request | ${COMPANY.name}`,
    html: wrapInLayout('Password Reset', body)
  };
};


module.exports = {
  welcomeEmail,
  adminCreatedUserEmail,
  complaintRaisedCustomerEmail,
  complaintRaisedAdminEmail,
  technicianAssignedEmail,
  technicianAssignedCustomerEmail,
  statusUpdateEmail,
  complaintResolvedEmail,
  priorityEscalatedEmail,
  complaintClosedEmail,
  feedbackReceivedEmail,
  passwordResetEmail,
};
