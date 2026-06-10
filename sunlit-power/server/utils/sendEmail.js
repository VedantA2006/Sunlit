const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Sunlit Power Support" <${process.env.EMAIL_USER || 'support@sunlitpower.in'}>`,
      to,
      subject,
      html
    };

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'your_email@gmail.com') {
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
