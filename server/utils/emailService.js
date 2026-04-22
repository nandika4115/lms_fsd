// server/utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify connection on startup
transporter.verify()
    .then(() => console.log('✅ SMTP email service connected'))
    .catch((err) => console.error('❌ SMTP connection failed:', err.message));

/**
 * Send an email verification link to the user.
 */
const sendVerificationEmail = async (to, username, token) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verificationLink = `${clientUrl}/verify-email?token=${token}`;

    const mailOptions = {
        from: `"EduLearnPro" <${process.env.SMTP_USER}>`,
        to,
        subject: '✉️ Verify Your EduLearnPro Account',
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #004D40, #00796B); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">EduLearnPro</h1>
                <p style="color: #B2DFDB; margin: 8px 0 0; font-size: 14px;">Your Learning Journey Starts Here</p>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin: 0 0 16px; font-size: 22px;">Welcome, ${username}! 🎉</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                    Thank you for registering with EduLearnPro. To complete your registration and access all features, please verify your email address.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${verificationLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #00796B, #004D40); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,77,64,0.3);">
                        Verify My Email
                    </a>
                </div>
                <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                    This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #aaa; font-size: 12px; text-align: center;">
                    If the button doesn't work, copy and paste this link:<br/>
                    <a href="${verificationLink}" style="color: #00796B; word-break: break-all;">${verificationLink}</a>
                </p>
            </div>
        </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

/**
 * Send MFA backup codes to the user after they enable MFA.
 */
const sendMfaBackupCodes = async (to, username, backupCodes) => {
    const codesHtml = backupCodes
        .map(code => `<code style="display: inline-block; background: #f5f5f5; padding: 6px 14px; margin: 4px; border-radius: 6px; font-size: 14px; font-family: 'Courier New', monospace; letter-spacing: 2px; border: 1px solid #e0e0e0;">${code}</code>`)
        .join('');

    const mailOptions = {
        from: `"EduLearnPro" <${process.env.SMTP_USER}>`,
        to,
        subject: '🔐 Your MFA Backup Codes — Keep These Safe!',
        html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #1a237e, #283593); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 MFA Backup Codes</h1>
                <p style="color: #9fa8da; margin: 8px 0 0; font-size: 14px;">EduLearnPro Security</p>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin: 0 0 16px;">Hi ${username},</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    You've successfully enabled Two-Factor Authentication on your account. Here are your one-time backup codes:
                </p>
                <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; border: 1px solid #eee;">
                    ${codesHtml}
                </div>
                <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                    <p style="color: #e65100; font-size: 14px; margin: 0; font-weight: 600;">⚠️ Important</p>
                    <p style="color: #555; font-size: 13px; margin: 6px 0 0;">
                        Each backup code can only be used <strong>once</strong>. Store them in a secure location. If you lose both your authenticator app and these codes, you may lose access to your account.
                    </p>
                </div>
            </div>
        </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendMfaBackupCodes };
