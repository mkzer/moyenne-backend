// backend/email.js

require('dotenv').config();
const nodemailer = require('nodemailer');

// 1) Configuration du transport SMTP Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
    }
});

/**
 * Envoie un e-mail de réinitialisation de mot de passe.
 * @param {string} to  – adresse e-mail destinataire
 * @param {string} key – securityKey (UUID)
 */
async function sendResetEmail(to, key) {
    const resetUrl = `https://ton-frontend/reset.html?key=${key}`;
    const info = await transporter.sendMail({
        from: `"Gestion Moyennes" <${process.env.GMAIL_USER}>`,
        to,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>
    `
    });
    console.log(`E-mail de reset envoyé : ${info.messageId}`);
}

module.exports = { sendResetEmail };
