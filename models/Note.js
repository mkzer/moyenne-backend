// backend/models/Note.js

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    code: String,
    nom: String,
    note: Number,
    coefficient: Number,
    utilisateurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur'
    }
});

module.exports = mongoose.model('Note', noteSchema);
