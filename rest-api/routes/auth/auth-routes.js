const express = require("express");
const {
  login,
  register,
  logout,
  authMiddleware,
} = require("../../controllers/auth/auth-controllers");
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/profile", authMiddleware, (req, res) => {
  return res.json({
    success: true,
    user: req.user, // from middleware
  });
});

module.exports = router;
