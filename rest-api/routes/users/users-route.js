
const express = require("express");
const getAllUsers = require("../../controllers/users/users-controllers");
const router = express.Router();

router.get("/get-all-users", getAllUsers);

module.exports = router