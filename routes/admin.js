// routes/admin.js
const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Appliquer auth + admin à toutes les routes de ce router
router.use(auth, admin);

/**
 * GET /api/admin/classement
 * Query params:
 *   - type = "ue" | "general"   (default: "general")
 *   - parcours (ex: "M1 EEA MTI") – requis
 *   - code (ex: "871.1")         – requis si type=ue
 */
router.get("/classement", async (req, res) => {
    try {
        const { type = "general", parcours, code } = req.query;
        if (!parcours) {
            return res.status(400).json({ message: "Parcours requis." });
        }

        // Charger toutes les notes avec le parcours de chaque utilisateur
        const allNotes = await Note.find()
            .populate("utilisateurId", "prenom nom parcours");

        // Ne conserver que celles du parcours demandé
        const notesParcours = allNotes.filter(n =>
            n.utilisateurId &&
            n.utilisateurId.parcours === parcours
        );

        if (type === "ue") {
            if (!code) {
                return res.status(400).json({ message: "Code d'UE requis pour type=ue." });
            }
            // Regrouper la meilleure note par utilisateur pour cette UE
            const perUser = {};
            notesParcours
                .filter(n => n.code === code)
                .forEach(n => {
                    const uid = n.utilisateurId._id.toString();
                    // garder la note la plus élevée si plusieurs entrées
                    if (!perUser[uid] || n.note > perUser[uid].note) {
                        perUser[uid] = {
                            prenom: n.utilisateurId.prenom,
                            nom: n.utilisateurId.nom,
                            note: n.note
                        };
                    }
                });
            // Trier par note décroissante
            const classementUE = Object.values(perUser)
                .sort((a, b) => b.note - a.note);
            return res.json(classementUE);
        }

        // === Classement général ===
        // Calculer moyennes pondérées
        const mapGen = notesParcours.reduce((acc, n) => {
            const uid = n.utilisateurId._id.toString();
            if (!acc[uid]) {
                acc[uid] = {
                    prenom: n.utilisateurId.prenom,
                    nom: n.utilisateurId.nom,
                    sum: 0,
                    coef: 0
                };
            }
            acc[uid].sum += n.note * n.coefficient;
            acc[uid].coef += n.coefficient;
            return acc;
        }, {});

        // Construire le tableau des moyennes
        const classementGen = Object.values(mapGen)
            .map(u => ({
                prenom: u.prenom,
                nom: u.nom,
                moyenne: u.coef > 0 ? parseFloat((u.sum / u.coef).toFixed(2)) : 0
            }))
            .sort((a, b) => b.moyenne - a.moyenne);

        return res.json(classementGen);
    } catch (err) {
        console.error("Erreur GET /api/admin/classement :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

/**
 * GET /api/admin/histogram
 * Query params:
 *   - parcours (ex: "M1 EEA ISHM") – requis
 *   - code     (ex: "871.1")         – requis
 * Renvoie un array de notes pour l’UE donnée et le parcours donné.
 */
router.get("/histogram", async (req, res) => {
    try {
        const { parcours, code } = req.query;
        if (!parcours || !code) {
            return res.status(400).json({ message: "Parcours et code requis." });
        }
        // Charger et filtrer
        const notes = await Note.find({ code })
            .populate("utilisateurId", "parcours");
        const data = notes
            .filter(n => n.utilisateurId && n.utilisateurId.parcours === parcours)
            .map(n => n.note);
        return res.json(data);
    } catch (err) {
        console.error("Erreur GET /api/admin/histogram :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

module.exports = router;
