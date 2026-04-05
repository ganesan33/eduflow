const nodemailer = require('nodemailer');

function getMailConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'EduFlow <no-reply@example.com>';

  return {
    host,
    port,
    user,
    pass,
    from,
    isConfigured: Boolean(user && pass)
  };
}

function buildTransporter() {
  const config = getMailConfig();

  if (!config.isConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
}

async function sendEmail({ to, subject, html, text }) {
  const config = getMailConfig();
  const transporter = buildTransporter();

  if (!transporter) {
    throw new Error('SMTP is not configured. Set SMTP_USER and SMTP_PASS to enable emails.');
  }

  try {
    // Verify SMTP connection before sending
    await transporter.verify();
    
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    });

    const acceptedCount = Array.isArray(info.accepted) ? info.accepted.length : 0;
    if (acceptedCount === 0) {
      throw new Error('Email was not accepted by SMTP provider');
    }

    return info;
  } catch (error) {
    console.error('Email sending failed:', {
      error: error.message,
      code: error.code,
      command: error.command
    });
    throw error;
  }
}

module.exports = {
  getMailConfig,
  sendEmail
};
