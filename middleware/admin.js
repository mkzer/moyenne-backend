module.exports = (req, res, next) => {
    // `req.utilisateur` est défini par auth.js
    if (!req.utilisateur || !req.utilisateur.isAdmin) {
        return res.status(403).json({ message: "Accès interdit (admin uniquement)." });
    }
    next();
};
