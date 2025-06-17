// routes/notes.js

const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Utilisateur = require('../models/Utilisateur');
const auth = require('../middleware/auth');

// UE communes et par parcours (inchangé)
const commun = [ /* ... */];
const parcoursNotes = { /* ... */ };

/** Récupérer les notes de l’utilisateur connecté **/
router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ utilisateurId: req.utilisateur.id });
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

/** Créer une note manuelle **/
router.post('/', auth, async (req, res) => {
    try {
        const { code, nom, note, coefficient } = req.body;
        const nouvelle = new Note({
            code, nom, note, coefficient,
            utilisateurId: req.utilisateur.id
        });
        await nouvelle.save();
        res.status(201).json(nouvelle);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur création note." });
    }
});

/** Initialiser automatiquement les notes selon le parcours **/
router.post('/init', auth, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur.id);
        if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé." });

        const mapping = {
            "M1 EEA MTI": "MTI",
            "M1 EEA ISHM": "ISHM",
            "M1 EEA IMEEN": "IMEEN"
        };
        const codeParcours = mapping[utilisateur.parcours?.trim().toUpperCase()] || utilisateur.parcours;
        const notesParcours = parcoursNotes[codeParcours];
        if (!notesParcours) return res.json({ message: "Pas de notes auto pour ce parcours." });

        const deja = await Note.findOne({ utilisateurId: utilisateur.id });
        if (deja) return res.json({ message: "Notes déjà initialisées." });

        const notesToInsert = notesParcours.map(n => ({
            code: n.code,
            nom: n.nom,
            coefficient: n.coefficient,
            note: 0,
            utilisateurId: utilisateur.id
        }));
        await Note.insertMany(notesToInsert);
        res.status(201).json({ message: "Notes initialisées." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

/** Mettre à jour une note **/
router.put('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            utilisateurId: req.utilisateur.id
        });
        if (!note) return res.status(404).json({ message: "Note introuvable." });
        if (typeof req.body.note === "number") {
            note.note = Math.round(req.body.note * 100) / 100;
            await note.save();
        }
        res.json({ message: "Note mise à jour." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

/** ▶ GET /api/notes/ranks — calcul des rangs **/
router.get('/ranks', auth, async (req, res) => {
    try {
        const userId = req.utilisateur.id;
        const utilisateur = await Utilisateur.findById(userId);
        if (!utilisateur) return res.status(404).json({ message: "Utilisateur non trouvé." });
        const parcours = utilisateur.parcours;

        // 1) Récupère toutes les notes, avec parcours de l'utilisateur
        const allNotes = await Note.find().populate('utilisateurId', 'parcours');

        // 2) Ne conserver que celles bien peuplées
        const validNotes = allNotes.filter(n =>
            n.utilisateurId &&
            typeof n.utilisateurId.parcours === 'string'
        );

        // 3) Notes de l'utilisateur
        const userNotes = validNotes.filter(n =>
            n.utilisateurId._id?.toString() === userId
        );

        // 4) Rangs par EC
        const noteRanks = {};
        for (const note of userNotes) {
            const sameEC = validNotes
                .filter(n =>
                    n.code === note.code &&
                    n.utilisateurId.parcours === parcours
                )
                .map(n => n.note)
                .sort((a, b) => b - a);
            noteRanks[note._id] = sameEC.indexOf(note.note) + 1;
        }

        // 5) Moyennes générales par étudiant du même parcours
        const mapByUser = {};
        validNotes
            .filter(n => n.utilisateurId.parcours === parcours)
            .forEach(n => {
                const uid = n.utilisateurId._id.toString();
                if (!mapByUser[uid]) mapByUser[uid] = { sum: 0, coef: 0 };
                mapByUser[uid].sum += n.note * n.coefficient;
                mapByUser[uid].coef += n.coefficient;
            });

        const averages = Object.entries(mapByUser)
            .map(([uid, { sum, coef }]) => ({
                uid,
                avg: coef > 0 ? sum / coef : 0
            }))
            .sort((a, b) => b.avg - a.avg);

        const generalRank = averages.findIndex(a => a.uid === userId) + 1;
        const totalStudents = averages.length;

        return res.json({ noteRanks, generalRank, totalStudents });
    } catch (err) {
        console.error("Erreur GET /notes/ranks :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

module.exports = router;
