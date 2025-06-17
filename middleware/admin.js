// middleware/admin.js
module.exports = (req, res, next) => {
    // `req.utilisateur` doit exister grâce au middleware `auth`
    if (!req.utilisateur || !req.utilisateur.isAdmin) {
        return res.status(403).json({ message: "Accès interdit (admin uniquement)." });
    }
    next();
};
