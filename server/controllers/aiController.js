const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.studentChatbot = async (req, res) => {
  try {
    const { question } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an educational AI assistant helping students understand course concepts clearly and simply.",
        },
        {
          role: "user",
          content: question,
        },
      ],
      max_tokens: 300,
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "AI chatbot failed",
    });
  }
};

exports.instructorSummary = async (req, res) => {
    try {
        const { questions } = req.body;

        if (!questions || !questions.length) {
            return res.status(400).json({
                message: "Questions are required",
            });
        }

        const prompt = `
Summarize these student questions clearly.
Group similar doubts together and make it easy for the instructor to reply:

${questions.join("\n")}
        `;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an instructor assistant that summarizes student doubts clearly and briefly for faster teaching.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: 500,
        });

        return res.json({
            summary: completion.choices[0].message.content,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "AI summary failed",
        });
    }
};