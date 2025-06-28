const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Utilisateur = require("../models/Utilisateur");
const auth = require("../middleware/auth");

// GET /api/admin/classement?parcours=...&type=general|ue[&code=...]
// Classement général ou par UE
router.get("/classement", auth, async (req, res) => {
    if (!req.utilisateur.isAdmin) {
        return res.status(403).json({ message: "Accès admin uniquement." });
    }
    const { parcours, type, code } = req.query;
    if (!parcours || !type) return res.status(400).json({ message: "Paramètres manquants." });

    try {
        // Filtrer utilisateurs selon le parcours
        const utilisateurs = await Utilisateur.find({ parcours }).select("prenom nom _id");
        const userIds = utilisateurs.map(u => u._id);
        let data = [];

        if (type === "general") {
            // Moyenne générale par utilisateur
            for (const u of utilisateurs) {
                const notes = await Note.find({ utilisateurId: u._id });
                let sum = 0, coef = 0;
                notes.forEach(n => {
                    sum += n.note * n.coefficient;
                    coef += n.coefficient;
                });
                const moyenne = coef > 0 ? sum / coef : 0;
                data.push({
                    prenom: u.prenom,
                    nom: u.nom,
                    moyenne
                });
            }
            // Tri décroissant
            data.sort((a, b) => b.moyenne - a.moyenne);

        } else if (type === "ue" && code) {
            // Classement par note d’UE (par code EC/UE)
            for (const u of utilisateurs) {
                const note = await Note.findOne({ utilisateurId: u._id, code });
                data.push({
                    prenom: u.prenom,
                    nom: u.nom,
                    note: note ? note.note : 0
                });
            }
            data.sort((a, b) => b.note - a.note);

        } else {
            return res.status(400).json({ message: "Type ou code UE invalide." });
        }
        res.json(data);

    } catch (err) {
        console.error("Erreur classement admin :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// GET /api/admin/histogram?parcours=...&code=...
// Histogramme des notes pour une UE (code)
router.get("/histogram", auth, async (req, res) => {
    if (!req.utilisateur.isAdmin) {
        return res.status(403).json({ message: "Accès admin uniquement." });
    }
    const { parcours, code } = req.query;
    if (!parcours || !code) return res.status(400).json({ message: "Paramètres manquants." });

    try {
        // Trouve tous les utilisateurs du parcours
        const utilisateurs = await Utilisateur.find({ parcours }).select("_id");
        const userIds = utilisateurs.map(u => u._id);

        // Récupère toutes les notes pour ce code chez ces utilisateurs
        const notes = await Note.find({ utilisateurId: { $in: userIds }, code });
        // Retourne un tableau des valeurs (pour l’histogramme)
        const notesTab = notes.map(n => n.note);

        res.json(notesTab);

    } catch (err) {
        console.error("Erreur histogram admin :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

module.exports = router;
