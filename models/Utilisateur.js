const mongoose = require('mongoose');

const utilisateurSchema = new mongoose.Schema({
    prenom: {
        type: String,
        required: true,
    },
    nom: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    motDePasse: {
        type: String,
        required: true,
    },
    parcours: {
        type: String, // Exemples : 'M1 EEA MTI', 'M1 EEA ISHM', etc.
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    }
});

module.exports = mongoose.model('Utilisateur', utilisateurSchema);
