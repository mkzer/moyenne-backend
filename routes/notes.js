// routes/notes.js

const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Utilisateur = require('../models/Utilisateur');
const auth = require('../middleware/auth');

// Définitions des UE communes et par parcours (inchangées)
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
    MTI: [
        ...commun,
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
        { code: "885.2", nom: "Télémesure et transmission écrit", coefficient: 1.5 }
    ],
    ISHM: [
        ...commun,
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
        { code: "882.3", nom: "Supervision réseau informatique TP", coefficient: 1 }
    ],
    IMEEN: [
        ...commun,
        { code: "861.1", nom: "Biomasse/Biogaz", coefficient: 1.5 },
        { code: "861.2", nom: "Bois énergie déchet", coefficient: 1.5 },
        { code: "862.1", nom: "Modélisation thermique du bâtiment écrit", coefficient: 0.75 },
        { code: "862.2", nom: "Modélisation thermique du bâtiment TP", coefficient: 0.75 },
        { code: "862.3", nom: "Étude des matériaux", coefficient: 1.5 },
        { code: "862.4", nom: "Chauffage ventilation climatisation", coefficient: 1.5 },
        { code: "862.5", nom: "BIM écrit", coefficient: 0.75 },
        { code: "862.6", nom: "BIM TP", coefficient: 0.75 },
        { code: "863.1", nom: "Technologie des énergies renouvelables", coefficient: 3 },
        { code: "863.2", nom: "Métrologie et caméra thermique", coefficient: 3 }
    ]
};

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
            code,
            nom,
            note,
            coefficient,
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
        if (!notesParcours) {
            return res.json({ message: "Pas de notes automatiques pour ce parcours." });
        }

        const deja = await Note.findOne({ utilisateurId: utilisateur.id });
        if (deja) {
            return res.json({ message: "Notes déjà initialisées." });
        }

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

/** Mettre à jour une note **/
router.put('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            utilisateurId: req.utilisateur.id
        });
        if (!note) {
            return res.status(404).json({ message: "Note introuvable." });
        }
        if (typeof req.body.note === "number") {
            note.note = Math.round(req.body.note * 100) / 100;
        }
        await note.save();
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

        // Récupère toutes les notes avec leur utilisateur
        const allNotes = await Note.find().populate('utilisateurId', 'parcours');

        // Filtre les notes orphelines ou sans parcours
        const validNotes = allNotes.filter(n => n.utilisateurId && n.utilisateurId.parcours);

        // Notes de l’utilisateur
        const userNotes = validNotes.filter(n =>
            n.utilisateurId._id.equals(userId)
        );

        // Calcule le rang de chaque EC
        const noteRanks = {};
        for (const note of userNotes) {
            const same = validNotes
                .filter(n =>
                    n.code === note.code &&
                    n.utilisateurId.parcours === parcours
                )
                .map(n => n.note)
                .sort((a, b) => b - a);
            noteRanks[note._id] = same.indexOf(note.note) + 1;
        }

        // Moyenne générale par étudiant du même parcours
        const mapByUser = validNotes
            .filter(n => n.utilisateurId.parcours === parcours)
            .reduce((acc, n) => {
                const uid = n.utilisateurId._id.toString();
                if (!acc[uid]) acc[uid] = { sum: 0, coef: 0 };
                acc[uid].sum += n.note * n.coefficient;
                acc[uid].coef += n.coefficient;
                return acc;
            }, {});

        const averages = Object.entries(mapByUser)
            .map(([uid, { sum, coef }]) => ({
                uid,
                avg: coef > 0 ? sum / coef : 0
            }))
            .sort((a, b) => b.avg - a.avg);

        const generalRank = averages.findIndex(a => a.uid === userId) + 1;
        const totalStudents = averages.length;

        res.json({
            noteRanks,
            generalRank,
            totalStudents
        });
    } catch (err) {
        console.error("Erreur GET /notes/ranks :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

module.exports = router;
