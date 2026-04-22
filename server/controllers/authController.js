const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const db = require("../config/db");
const { sendVerificationEmail, sendMfaBackupCodes } = require("../utils/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key_that_is_long_and_random";

// Helper: generate a random verification token
const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

// Helper: generate backup codes
const generateBackupCodes = (count = 8) => {
    const codes = [];
    for (let i = 0; i < count; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
};

// --- ✅ UPDATED: Register User (with email verification) ---
exports.register = async (req, res) => {
    const {
        username, email, password, role,
        firstName, lastName, phoneNumber, age, currentActivity, activityPlace
    } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "Core fields (username, email, password, role) are required." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const roleToSave = role === 'instructor' ? 'pending_instructor' : role;

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const query = `
        INSERT INTO users 
        (username, email, password, role, first_name, last_name, phone_number, age, current_activity, activity_place,
         email_verified, verification_token, verification_token_expires) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
    `;

    const values = [
        username,
        email,
        hashedPassword,
        roleToSave,
        firstName,
        lastName,
        phoneNumber || null,
        age ? parseInt(age) : null,
        currentActivity || null,
        activityPlace || null,
        false,                  // email_verified = false
        verificationToken,
        tokenExpires
    ];

    try {
        const result = await db.query(query, values);
        const newUserId = result.rows[0]?.id;

        // Send verification email (don't let email failure block registration)
        try {
            await sendVerificationEmail(email, username, verificationToken);
            console.log(`📧 Verification email sent to ${email}`);
        } catch (emailErr) {
            console.error('❌ Failed to send verification email:', emailErr.message);
        }

        // If instructor, inform about pending approval
        if (roleToSave === 'pending_instructor') {
            return res.status(201).json({
                message: 'Instructor registration received. Please verify your email first, then await admin approval.',
                requiresVerification: true
            });
        }

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.',
            requiresVerification: true
        });

    } catch (err) {
        console.error("❌ Registration query error:", err);
        if (err.code === '23505') {
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        return res.status(500).json({ error: err.message, details: err.detail });
    }
};

// --- ✉️ NEW: Verify Email ---
exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: "Verification token is required." });
    }

    try {
        const result = await db.query(
            'SELECT id, email_verified, verification_token_expires FROM users WHERE verification_token = $1',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Invalid verification token." });
        }

        const user = result.rows[0];

        if (user.email_verified) {
            return res.status(200).json({ message: "Email already verified. You can login." });
        }

        // Check if token has expired
        if (new Date() > new Date(user.verification_token_expires)) {
            return res.status(400).json({ message: "Verification link has expired. Please request a new one." });
        }

        // Mark email as verified, clear the token
        await db.query(
            'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
            [user.id]
        );

        res.json({ message: "Email verified successfully! You can now login." });

    } catch (err) {
        console.error("❌ Email verification error:", err);
        res.status(500).json({ error: "Verification failed. Please try again." });
    }
};

// --- 🔄 NEW: Resend Verification Email ---
exports.resendVerification = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email address is required." });
    }

    try {
        const result = await db.query('SELECT id, username, email_verified FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            // Don't reveal whether the email exists
            return res.json({ message: "If an account with this email exists, a verification link has been sent." });
        }

        const user = result.rows[0];

        if (user.email_verified) {
            return res.status(400).json({ message: "This email is already verified." });
        }

        // Generate new token
        const verificationToken = generateVerificationToken();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.query(
            'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
            [verificationToken, tokenExpires, user.id]
        );

        await sendVerificationEmail(email, user.username, verificationToken);

        res.json({ message: "If an account with this email exists, a verification link has been sent." });

    } catch (err) {
        console.error("❌ Resend verification error:", err);
        res.status(500).json({ error: "Failed to resend verification email." });
    }
};

// --- 🔐 UPDATED: Login User (with email verification + MFA check) ---
exports.login = async (req, res) => {
    const { email, password } = req.body;

    console.log("🔄 Login attempt for email:", email);

    try {
        const results = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (results.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = results.rows[0];

        // Block pending/rejected instructors
        if (user.role === 'pending_instructor') {
            return res.status(403).json({ message: "Your instructor account is pending admin approval." });
        }
        if (user.role === 'rejected') {
            return res.status(403).json({ message: "Your registration was rejected by the admin." });
        }

        // Check email verification
        if (!user.email_verified) {
            return res.status(403).json({
                message: "Please verify your email address before logging in.",
                emailNotVerified: true,
                email: user.email
            });
        }

        // Validate password
        if (!password || !user.password) {
            return res.status(400).json({ message: "Password is required." });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        // Check if MFA is enabled
        if (user.mfa_enabled && user.mfa_secret) {
            // Issue a short-lived temp token for MFA verification
            const tempToken = jwt.sign(
                { id: user.id, username: user.username, role: user.role, mfaPending: true },
                JWT_SECRET,
                { expiresIn: "5m" }
            );

            console.log("🔐 MFA required for user:", user.username);
            return res.json({
                mfaRequired: true,
                tempToken
            });
        }

        // No MFA — issue full JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        console.log("🎫 Login successful for user:", user.username);
        res.json({ token, role: user.role });

    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
};

// --- 🔐 NEW: Verify MFA Code during Login ---
exports.verifyMfa = async (req, res) => {
    const { tempToken, code, isBackupCode } = req.body;

    if (!tempToken || !code) {
        return res.status(400).json({ message: "Token and code are required." });
    }

    try {
        // Verify the temp token
        const decoded = jwt.verify(tempToken, JWT_SECRET);

        if (!decoded.mfaPending) {
            return res.status(400).json({ message: "Invalid MFA verification request." });
        }

        // Get user's MFA secret from DB
        const result = await db.query(
            'SELECT id, username, role, mfa_secret, mfa_backup_codes FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = result.rows[0];
        let isValid = false;

        if (isBackupCode) {
            // Check backup codes
            const backupCodes = user.mfa_backup_codes || [];
            const codeIndex = backupCodes.indexOf(code.toUpperCase());

            if (codeIndex > -1) {
                isValid = true;
                // Remove used backup code
                backupCodes.splice(codeIndex, 1);
                await db.query(
                    'UPDATE users SET mfa_backup_codes = $1 WHERE id = $2',
                    [backupCodes, user.id]
                );
            }
        } else {
            // Verify TOTP code
            isValid = speakeasy.totp.verify({
                secret: user.mfa_secret,
                encoding: 'base32',
                token: code,
                window: 1 // Allow 1 step before/after for clock drift
            });
        }

        if (!isValid) {
            return res.status(401).json({ message: "Invalid verification code." });
        }

        // Issue full JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        console.log("🎫 MFA verification successful for user:", user.username);
        res.json({ token, role: user.role });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "MFA session expired. Please login again." });
        }
        console.error("❌ MFA verification error:", err);
        res.status(500).json({ error: "MFA verification failed." });
    }
};

// --- 🔐 NEW: Setup MFA (generate secret + QR code) ---
exports.setupMfa = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if MFA is already enabled
        const result = await db.query('SELECT mfa_enabled, username, email FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = result.rows[0];
        if (user.mfa_enabled) {
            return res.status(400).json({ message: "MFA is already enabled on this account." });
        }

        // Generate TOTP secret
        const secret = speakeasy.generateSecret({
            name: `EduLearnPro (${user.email})`,
            issuer: 'EduLearnPro'
        });

        // Store the secret temporarily (not enabled yet until confirmed)
        await db.query('UPDATE users SET mfa_secret = $1 WHERE id = $2', [secret.base32, userId]);

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            secret: secret.base32,
            qrCode: qrCodeDataUrl
        });

    } catch (err) {
        console.error("❌ MFA setup error:", err);
        res.status(500).json({ error: "Failed to setup MFA." });
    }
};

// --- 🔐 NEW: Confirm MFA Setup (verify first code + enable) ---
exports.confirmMfa = async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ message: "Verification code is required." });
    }

    try {
        const userId = req.user.id;

        const result = await db.query('SELECT mfa_secret, username, email FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = result.rows[0];

        if (!user.mfa_secret) {
            return res.status(400).json({ message: "Please initiate MFA setup first." });
        }

        // Verify the TOTP code
        const isValid = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!isValid) {
            return res.status(401).json({ message: "Invalid code. Please try again with a new code from your authenticator app." });
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes(8);

        // Enable MFA + store backup codes
        await db.query(
            'UPDATE users SET mfa_enabled = TRUE, mfa_backup_codes = $1 WHERE id = $2',
            [backupCodes, userId]
        );

        // Send backup codes via email
        try {
            await sendMfaBackupCodes(user.email, user.username, backupCodes);
        } catch (emailErr) {
            console.error('❌ Failed to send MFA backup codes email:', emailErr.message);
        }

        console.log("🔐 MFA enabled for user:", user.username);
        res.json({
            message: "Two-Factor Authentication has been enabled!",
            backupCodes
        });

    } catch (err) {
        console.error("❌ MFA confirm error:", err);
        res.status(500).json({ error: "Failed to enable MFA." });
    }
};

// --- 🔐 NEW: Disable MFA ---
exports.disableMfa = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: "Password is required to disable MFA." });
    }

    try {
        const userId = req.user.id;

        const result = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = result.rows[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect password." });
        }

        await db.query(
            'UPDATE users SET mfa_enabled = FALSE, mfa_secret = NULL, mfa_backup_codes = NULL WHERE id = $1',
            [userId]
        );

        console.log("🔓 MFA disabled for user ID:", userId);
        res.json({ message: "Two-Factor Authentication has been disabled." });

    } catch (err) {
        console.error("❌ MFA disable error:", err);
        res.status(500).json({ error: "Failed to disable MFA." });
    }
};

// --- Logout (Unchanged) ---
exports.logout = (req, res) => {
    res.json({ message: "Logged out successfully" });
};

// --- Verify Token ---
exports.verifyToken = (req, res) => {
    try {
        if (req.user) {
            res.json({
                valid: true,
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                    exp: req.user.exp
                }
            });
        } else {
            res.status(401).json({ 
                valid: false, 
                message: 'Invalid token - no user data' 
            });
        }
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ 
            valid: false, 
            message: 'Token verification failed' 
        });
    }
};
