const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Utilisateur = require('../models/Utilisateur');
const auth = require('../middleware/auth');

// 🎯 Données des notes communes à tous les parcours
const commun = [
    { code: "801.1", nom: "Rapports de projet", coefficient: 3 },
    { code: "801.2", nom: "Présentations de projet", coefficient: 3 },
    { code: "ANG.1", nom: "Anglais Écrit", coefficient: 1.5 },
    { code: "ANG.2", nom: "Anglais Oral", coefficient: 1.5 },
    { code: "871.1", nom: "IA : Théorie", coefficient: 1.5 },
    { code: "871.2", nom: "IA : TP", coefficient: 1.5 },
    { code: "872.1.1", nom: "Unix : Examen écrit", coefficient: 0.5 },
    { code: "872.1.2", nom: "Unix : Rapport TP", coefficient: 0.5 },
    { code: "872.2.1", nom: "Réseaux : Examen", coefficient: 1 },
    { code: "872.2.2", nom: "Réseaux : TP", coefficient: 1 }
];

const parcoursNotes = {
    MTI: [ /* ... comme avant ... */ ],
    ISHM: [ /* ... comme avant ... */ ],
    IMEEN: [ /* ... comme avant ... */ ]
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

// ➕ Ajouter une note manuellement
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

// 🔄 Initialisation automatique des notes
router.post('/init', auth, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur.id);
        if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé." });

        const parcours = utilisateur.parcours;
        const notesParcours = parcoursNotes[parcours];

        if (!notesParcours) {
            return res.json({ message: "Pas de notes automatiques pour ce parcours." });
        }

        const deja = await Note.findOne({ utilisateurId: utilisateur.id });
        if (deja) {
            return res.json({ message: "Notes déjà initialisées." });
        }

        // ✅ Fusion des matières communes + spécifiques au parcours
        const notes = [...commun, ...notesParcours].map(n => ({
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
