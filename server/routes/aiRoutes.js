const express = require("express");
const router = express.Router();

const {
    studentChatbot,
    testConnection,
} = require("../controllers/aiController");

router.post("/student-chat", studentChatbot);
router.get("/test", testConnection);

module.exports = router;