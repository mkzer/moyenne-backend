const mongoose = require("mongoose");

const ueSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    nom: { type: String, required: true },
    coefficient: { type: Number, required: true },
    historique: [{
        date: { type: Date, default: () => new Date() },
        ancienValeur: mongoose.Mixed,
        nouvelleValeur: mongoose.Mixed,
        modifiePar: String
    }]
}, { timestamps: true });

module.exports = mongoose.model("UE", ueSchema);
