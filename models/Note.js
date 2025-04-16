const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
    },
    nom: {
        type: String,
        required: true,
    },
    note: {
        type: Number,
        required: true,
    },
    coefficient: {
        type: Number,
        required: true,
    },
    utilisateurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true,
    }
});

module.exports = mongoose.model('Note', noteSchema);
