const Groq = require("groq-sdk");
require("dotenv").config();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.warn("GROQ_API_KEY not set in environment. AI requests will fail.");
}

const groq = apiKey ? new Groq({ apiKey }) : null;

exports.studentChatbot = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (!groq) {
      return res.status(500).json({ message: "Groq API key is missing" });
    }

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `You are an educational AI assistant helping students understand course concepts clearly and simply.\n\nStudent question: ${question}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = message.choices[0]?.message?.content || "No response generated";

    res.json({ reply });
  } catch (error) {
    console.error("Student Chatbot Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      status: error.status,
      cause: error.cause,
    });
    res.status(500).json({
      message: "AI chatbot failed",
      error: error.message,
      details: error.name || "Unknown error",
    });
  }
};

exports.testConnection = async (req, res) => {
  try {
    if (!groq) {
      return res.status(500).json({ 
        status: "error",
        message: "Groq API key is missing" 
      });
    }

    const message = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: "Say hello briefly",
        },
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 256,
    });

    const reply = message.choices[0]?.message?.content || "No response generated";

    return res.json({
      status: "success",
      message: "Connection test passed",
      response: reply,
    });
  } catch (error) {
    console.error("Test Connection Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      status: error.status,
      cause: error.cause,
    });
    return res.status(500).json({
      status: "error",
      message: "Connection test failed",
      error: error.message,
      details: error.name || "Unknown error",
      stack: error.stack,
    });
  }
};
