const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const brevoApiKey = process.env.BREVO_API_KEY;

    // 1. If Brevo API Key is configured, use Brevo HTTP REST API (port 443 - never blocked by Render)
    if (brevoApiKey) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: 'Sunlit Power Pvt Ltd',
            email: process.env.EMAIL_FROM || 'geminivedant5@gmail.com'
          },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`Email sent successfully via Brevo API: ${data.messageId || 'Success'}`);
        return true;
      } else {
        throw new Error(data.message || JSON.stringify(data));
      }
    }

    let transporter;
    let fromEmail;

    if (resendKey) {
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: resendKey
        }
      });
      fromEmail = 'onboarding@resend.dev';
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'info@arenq.co.in';
    }

    const mailOptions = {
      from: `"Sunlit Power Pvt Ltd" <${fromEmail}>`,
      to,
      subject,
      html
    };

    if (!resendKey && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'your_email@gmail.com')) {
      console.log(`\n============== MOCK EMAIL SENT ==============`);
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${html.replace(/<[^>]*>/g, ' ')}`);
      console.log(`=============================================\n`);
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    return false;
  }
};

module.exports = sendEmail;
