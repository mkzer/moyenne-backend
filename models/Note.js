// backend/models/Note.js

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true
    },
    nom: {
        type: String,
        required: true,
        trim: true
    },
    note: {
        type: Number,
        required: true,
        min: 0,
        max: 20
    },
    coefficient: {
        type: Number,
        required: true,
        min: 0
    },
    utilisateurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true
    }
}, {
    timestamps: true
});

// Le modèle Mongoose généré a bien une méthode `.find()`
module.exports = mongoose.model('Note', noteSchema);
