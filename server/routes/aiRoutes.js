const express = require("express");
const router = express.Router();

const {
    studentChatbot,
    instructorSummary,
} = require("../controllers/aiController");

router.post("/student-chat", studentChatbot);
router.post("/instructor-summary", instructorSummary);

module.exports = router;