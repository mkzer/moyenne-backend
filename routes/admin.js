// routes/admin.js
const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Utilisateur = require("../models/Utilisateur");

/**
 * GET /api/admin/classement
 * Query params:
 *   - type = "ue" or "general"
 *   - code (only if type=ue): code de l'EC (ex: "871.1")
 *   - parcours (ex: "M1 EEA MTI")
 */
router.get("/classement", async (req, res) => {
    try {
        const { type = "general", code, parcours } = req.query;
        // Filtrer les notes du parcours demandé
        const all = await Note.find()
            .populate("utilisateurId", "prenom nom parcours");
        const valid = all.filter(n => n.utilisateurId.parcours === parcours);

        if (type === "ue") {
            if (!code) return res.status(400).json({ message: "Il faut un code d'UE." });
            // Classement pour cette UE
            const byUser = {};
            valid
                .filter(n => n.code === code)
                .forEach(n => {
                    const uid = n.utilisateurId._id.toString();
                    if (!byUser[uid]) byUser[uid] = { prenom: n.utilisateurId.prenom, nom: n.utilisateurId.nom, note: n.note };
                });
            const arr = Object.values(byUser).sort((a, b) => b.note - a.note);
            return res.json(arr);
        }

        // === général ===
        const mapGen = valid.reduce((acc, n) => {
            const uid = n.utilisateurId._id.toString();
            if (!acc[uid]) acc[uid] = { prenom: n.utilisateurId.prenom, nom: n.utilisateurId.nom, sum: 0, coef: 0 };
            acc[uid].sum += n.note * n.coefficient;
            acc[uid].coef += n.coefficient;
            return acc;
        }, {});
        const gens = Object.entries(mapGen)
            .map(([_, v]) => ({
                prenom: v.prenom,
                nom: v.nom,
                moyenne: v.coef > 0 ? v.sum / v.coef : 0
            }))
            .sort((a, b) => b.moyenne - a.moyenne);
        res.json(gens);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

/**
 * GET /api/admin/histogram
 * Query params:
 *   - code: code de l'EC (ex: "871.1")
 *   - parcours: parcours (ex: "M1 EEA ISHM")
 * Renvoie un tableau de notes pour tracer un histogramme.
 */
router.get("/histogram", async (req, res) => {
    try {
        const { code, parcours } = req.query;
        if (!code || !parcours) return res.status(400).json({ message: "Code et parcours requis." });

        const all = await Note.find()
            .populate("utilisateurId", "parcours")
            .where("code").equals(code)
            .where("utilisateurId.parcours").equals(parcours);

        // On renvoie juste la liste des notes numériques
        const data = all.map(n => n.note);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

module.exports = router;
