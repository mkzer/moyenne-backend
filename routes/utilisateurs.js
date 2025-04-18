const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/Utilisateur');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// 🎓 Liste des parcours valides
const parcoursValides = {
    "M1 EEA MTI": "MTI",
    "M1 EEA ISHM": "ISHM",
    "M1 EEA IMEEN": "IMEEN",
    "MTI": "MTI",
    "ISHM": "ISHM",
    "IMEEN": "IMEEN"
};

// ▶ INSCRIPTION
router.post('/inscription', async (req, res) => {
    console.log("📩 Demande inscription :", req.body);

    const { prenom, nom, email, motDePasse, parcours } = req.body;
    const parcoursNormalisé = parcoursValides[parcours];

    if (!parcoursNormalisé) {
        return res.status(400).json({ message: "Parcours inconnu ou non pris en charge." });
    }

    try {
        const existe = await Utilisateur.findOne({ email });
        if (existe) return res.status(400).json({ message: 'Email déjà utilisé.' });

        const utilisateur = new Utilisateur({
            prenom,
            nom,
            email,
            motDePasse, // en clair uniquement pour test
            parcours: parcoursNormalisé
        });

        await utilisateur.save();
        res.status(201).json({ message: 'Utilisateur créé avec succès.' });
    } catch (err) {
        console.error("❌ Erreur inscription :", err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// ▶ CONNEXION
router.post('/connexion', async (req, res) => {
    const { email, motDePasse } = req.body;

    try {
        const utilisateur = await Utilisateur.findOne({ email });
        if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

        if (motDePasse !== utilisateur.motDePasse) {
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
                isAdmin: utilisateur.isAdmin
            }
        });
    } catch (err) {
        console.error("❌ Erreur connexion :", err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// ▶ ADMIN : tous les utilisateurs
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

module.exports = router;
