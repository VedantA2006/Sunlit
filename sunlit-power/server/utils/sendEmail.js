const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const resendKey = process.env.RESEND_API_KEY;
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
      fromEmail = process.env.EMAIL_USER || 'support@arenq.com';
    }

    const mailOptions = {
      from: `"Arenq Support" <${fromEmail}>`,
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
