import express, { Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import ollama from "ollama";

const app = express();

app.use(cors());
const upload = multer({ dest: "uploads/" });

app.post(
  "/api/ocr",
  upload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file uploaded" });
        return;
      }

      const response = await ollama.chat({
        model: "llama3.2-vision:11b",
        messages: [
          {
            role: "user",
            content: `get ocr this image, get results only The timer's display screen or Answer the number that is likely to be read from the meter?, FOR EXAMPLE : The timer's display screen shows two sets of numbers:The image shows a digital display with two sets of numbers: 00576 and 42727 results is 0057642727. 
EXAMPLE ANSWER : Answer: 0057642727`,
            images: [req.file.path],
          },
        ],
      });

      // Extract final number after "the answer is:" or "**"
      const match = response.message.content.match(
        /(?:Answer:|.*\*\*)(\s*)(\d+)/i
      );
      const results = match ? match[2] : null;
      if (!results) {
        res
          .status(422)
          .json({ error: "Could not extract number from response" });
        return;
      }

      res.json({ result: results });
    } catch (error) {
      res.status(500).json({ error: "Failed to process image" });
    }
  }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
