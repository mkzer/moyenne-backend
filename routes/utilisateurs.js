const express = require('express');
const router = express.Router();
const Utilisateur = require('../models/Utilisateur');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

// ▶ INSCRIPTION
router.post('/inscription', async (req, res) => {
    const { prenom, nom, email, motDePasse, parcours } = req.body;

    try {
        const existe = await Utilisateur.findOne({ email });
        if (existe) return res.status(400).json({ message: 'Email déjà utilisé.' });

        const hash = await bcrypt.hash(motDePasse, 10);
        const utilisateur = new Utilisateur({
            prenom,
            nom,
            email,
            motDePasse: hash,
            parcours
        });

        await utilisateur.save();
        res.status(201).json({ message: 'Utilisateur créé avec succès.' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// ▶ CONNEXION
router.post('/connexion', async (req, res) => {
    const { email, motDePasse } = req.body;

    try {
        const utilisateur = await Utilisateur.findOne({ email });
        if (!utilisateur) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

        const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
        if (!valide) return res.status(401).json({ message: 'Mot de passe incorrect.' });

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

module.exports = router;
