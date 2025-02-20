const express = require("express");
const { getUsers, createUser } = require("../controllers/userController");

const router = express.Router();

// מסלול לקבלת כל המשתמשים
router.get("/", getUsers);

// מסלול ליצירת משתמש חדש
router.post("/", createUser);

module.exports = router;
