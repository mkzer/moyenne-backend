const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Utilisateur = require('../models/Utilisateur');
const auth = require('../middleware/auth');

// 🎯 Données des notes par parcours
const parcoursNotes = {
    MTI: [
        { code: "881.1", nom: "Accélération matérielle", coefficient: 1.5 },
        { code: "881.2", nom: "TP Mise en œuvre", coefficient: 1.5 },
        { code: "882.1", nom: "Supervision industrielle", coefficient: 1.5 },
        { code: "882.2", nom: "Supervision réseau informatique écrit", coefficient: 0.5 },
        { code: "882.3", nom: "Supervision réseau informatique TP", coefficient: 1 },
        { code: "883.1", nom: "Commande de systèmes numériques écrit 1", coefficient: 1.5 },
        { code: "883.2", nom: "Commande de systèmes numériques écrit 2", coefficient: 1.5 },
        { code: "884.1", nom: "Outils de mise en forme de l'information", coefficient: 1.5 },
        { code: "884.2", nom: "Travaux Pratiques", coefficient: 1.5 },
        { code: "885.1", nom: "Télémesure et transmission TP", coefficient: 1.5 },
        { code: "885.2", nom: "Télémesure et transmission écrit", coefficient: 1.5 },
    ],
    ISHM: [
        { code: "873.1", nom: "Simulation des systèmes automatiques écrit", coefficient: 1.5 },
        { code: "873.2", nom: "Simulation des systèmes automatiques TP", coefficient: 1.5 },
        { code: "874.1", nom: "Traitement numérique du signal écrit", coefficient: 3 },
        { code: "874.2", nom: "Traitement numérique du signal TP", coefficient: 1.5 },
        { code: "874.3", nom: "Méthode régulation numérique écrit", coefficient: 1.75 },
        { code: "874.4", nom: "Méthode régulation numérique TP", coefficient: 0.5 },
        { code: "874.5", nom: "Représentation d'état écrit", coefficient: 1.75 },
        { code: "874.6", nom: "Représentation d'état TP", coefficient: 0.5 },
        { code: "882.1", nom: "Supervision industrielle", coefficient: 1.5 },
        { code: "882.2", nom: "Supervision réseau informatique écrit", coefficient: 0.5 },
        { code: "882.3", nom: "Supervision réseau informatique TP", coefficient: 1 },
    ],
    IMEEN: [
        { code: "861.1", nom: "Biomasse/Biogaz", coefficient: 1.5 },
        { code: "861.2", nom: "Bois énergie déchet", coefficient: 1.5 },
        { code: "862.1", nom: "Modélisation thermique du bâtiment écrit", coefficient: 0.75 },
        { code: "862.2", nom: "Modélisation thermique du bâtiment TP", coefficient: 0.75 },
        { code: "862.3", nom: "Étude des matériaux", coefficient: 1.5 },
        { code: "862.4", nom: "Chauffage ventilation climatisation", coefficient: 1.5 },
        { code: "862.5", nom: "BIM écrit", coefficient: 0.75 },
        { code: "862.6", nom: "BIM TP", coefficient: 0.75 },
        { code: "863.1", nom: "Technologie des énergies renouvelables", coefficient: 3 },
        { code: "863.2", nom: "Métrologie et caméra thermique", coefficient: 3 },
    ]
};

// 📥 Récupérer toutes les notes de l’utilisateur
router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ utilisateurId: req.utilisateur.id });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// ➕ Ajouter une note manuellement (pour "Autre" ou si note personnalisée)
router.post('/', auth, async (req, res) => {
    const { code, nom, note, coefficient } = req.body;

    try {
        const nouvelleNote = new Note({
            code,
            nom,
            note,
            coefficient,
            utilisateurId: req.utilisateur.id
        });

        await nouvelleNote.save();
        res.status(201).json({ message: 'Note ajoutée.', note: nouvelleNote });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// 🔁 Modifier une note
router.put('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, utilisateurId: req.utilisateur.id },
            req.body,
            { new: true }
        );

        if (!note) return res.status(404).json({ message: 'Note introuvable.' });

        res.json({ message: 'Note modifiée.', note });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// 🔄 Initialisation automatique des notes selon parcours (à appeler côté frontend au 1er chargement)
router.post('/init', auth, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur.id);
        if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé." });

        const parcours = utilisateur.parcours;
        const notesParcours = parcoursNotes[parcours];

        if (!notesParcours) {
            return res.json({ message: "Pas de notes automatiques pour ce parcours." });
        }

        // Vérifie si déjà initialisé
        const deja = await Note.findOne({ utilisateurId: utilisateur.id });
        if (deja) {
            return res.json({ message: "Notes déjà initialisées." });
        }

        // Crée les notes avec note = 0
        const notes = notesParcours.map(n => ({
            code: n.code,
            nom: n.nom,
            coefficient: n.coefficient,
            note: 0,
            utilisateurId: utilisateur.id
        }));

        await Note.insertMany(notes);
        res.status(201).json({ message: "Notes initialisées avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

module.exports = router;
