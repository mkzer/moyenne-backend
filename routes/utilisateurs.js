const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/Utilisateur');
const Note = require('../models/Note');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ▶ INSCRIPTION avec hash et vérification des champs
router.post('/inscription', async (req, res) => {
    console.log(">>> [POST] /inscription", req.body);

    const { prenom, nom, email, motDePasse, parcours } = req.body;

    // 🔒 Vérification des champs manquants
    const champsManquants = [];
    if (!prenom) champsManquants.push("prenom");
    if (!nom) champsManquants.push("nom");
    if (!email) champsManquants.push("email");
    if (!motDePasse) champsManquants.push("motDePasse");
    if (!parcours || parcours === "Choisissez votre parcours") champsManquants.push("parcours");

    if (champsManquants.length > 0) {
        return res.status(400).json({ message: "Veuillez remplir : " + champsManquants.join(", ") });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Format d'email invalide." });
    }

    try {
        const existe = await Utilisateur.findOne({ email });
        if (existe) return res.status(400).json({ message: 'Email déjà utilisé.' });

        const hash = await bcrypt.hash(motDePasse, 10);
        const securityKey = uuidv4();

        const utilisateur = new Utilisateur({
            prenom,
            nom,
            email,
            motDePasse: hash,
            parcours,
            securityKey
        });

        await utilisateur.save();
        res.status(201).json({ message: 'Utilisateur créé avec succès.' });
    } catch (err) {
        console.error("Erreur lors de l'inscription :", err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// ▶ CONNEXION avec comparaison hash
router.post('/connexion', async (req, res) => {
    const { email, motDePasse } = req.body;

    try {
        const utilisateur = await Utilisateur.findOne({ email });
        if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

        const isMatch = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mot de passe incorrect.' });
        }

        const token = jwt.sign(
            { id: utilisateur._id, isAdmin: utilisateur.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            message: 'Connexion réussie.',
            token,
            utilisateur: {
                id: utilisateur._id,
                prenom: utilisateur.prenom,
                nom: utilisateur.nom,
                email: utilisateur.email,
                parcours: utilisateur.parcours,
                isAdmin: utilisateur.isAdmin,
                securityKey: utilisateur.securityKey
            }
        });
    } catch (err) {
        console.error("Erreur lors de la connexion :", err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// ▶ ADMIN : liste de tous les utilisateurs
router.get('/', auth, async (req, res) => {
    if (!req.utilisateur.isAdmin) {
        return res.status(403).json({ message: 'Accès interdit (admin uniquement).' });
    }

    try {
        const utilisateurs = await Utilisateur.find().select("-motDePasse");
        res.json(utilisateurs);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// ▶ PROFIL : informations de l'utilisateur connecté
router.get('/me', auth, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur.id).select('-motDePasse');
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.json(utilisateur);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// ▶ SUPPRESSION DE COMPTE
router.delete('/me', auth, async (req, res) => {
    try {
        await Utilisateur.findByIdAndDelete(req.utilisateur.id);
        await Note.deleteMany({ utilisateurId: req.utilisateur.id });
        res.json({ message: 'Compte supprimé.' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
