const nodemailer = require('nodemailer');

class MailService {
  static transporter = null;
  static isEthereal = false;

  static async getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      console.log(`[MailService] Initializing SMTP transporter with host: ${host}:${port}`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
      this.isEthereal = false;
    } else {
      console.log('[MailService] SMTP credentials not fully configured in environment. Creating Ethereal Test Account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        this.isEthereal = true;
        console.log(`[MailService] Ethereal account created. Username: ${testAccount.user}`);
      } catch (error) {
        console.error('[MailService] Failed to create Ethereal account, falling back to JSON transport:', error.message);
        this.transporter = nodemailer.createTransport({
          jsonTransport: true
        });
        this.isEthereal = false;
      }
    }
    return this.transporter;
  }

  static async sendResetPasswordEmail(email, tempPassword) {
    try {
      const transporter = await this.getTransporter();
      const from = process.env.SMTP_FROM || '"AdSight Support" <support@adsight.com>';
      
      const mailOptions = {
        from,
        to: email,
        subject: 'AdSight - Reset Password Akun Anda',
        text: `Halo,\n\nPassword akun AdSight Anda telah di-reset oleh admin.\n\nBerikut adalah password sementara Anda:\n\n${tempPassword}\n\nSilakan login kembali dan segera ubah password Anda di menu profil.\n\nSalam,\nTim AdSight`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Halo,</h2>
            <p>Password akun AdSight Anda telah di-reset oleh admin.</p>
            <p>Berikut adalah password sementara Anda:</p>
            <div style="background: #f4f4f5; padding: 15px; font-size: 20px; font-weight: bold; letter-spacing: 1px; text-align: center; border-radius: 5px; margin: 20px 0;">
              ${tempPassword}
            </div>
            <p style="color: #ef4444; font-weight: 500;">Silakan login kembali dan segera ubah password Anda demi keamanan akun Anda.</p>
            <br>
            <p>Salam,</p>
            <p><strong>Tim AdSight</strong></p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      
      if (this.isEthereal) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[MailService] Ethereal Email Sent! Preview URL: ${previewUrl}`);
        return { sent: true, previewUrl, messageId: info.messageId };
      } else if (transporter.options.jsonTransport) {
        console.log('[MailService] JSON Transport Email Content:', JSON.stringify(info.message, null, 2));
        return { sent: true, logged: true, messageId: info.messageId };
      } else {
        console.log(`[MailService] Email sent successfully: ${info.messageId}`);
        return { sent: true, messageId: info.messageId };
      }
    } catch (error) {
      console.error('[MailService] Error sending email:', error);
      return { sent: false, error: error.message };
    }
  }
}

module.exports = MailService;
