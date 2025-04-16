const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// ➕ Ajouter une note
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

// 📥 Récupérer toutes les notes de l’utilisateur
router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ utilisateurId: req.utilisateur.id });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
