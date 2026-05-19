import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { WebSocket } from 'ws';

async function startServer() {
  console.log("Initializing server...");
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check endpoint for Cloud Run
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', node_env: process.env.NODE_ENV });
  });

  app.post('/api/speech-to-text', express.raw({ type: ['*/*', 'application/octet-stream'], limit: '50mb' }), async (req, res) => {
    try {
      // Expecting 16000 Hz, 16-bit PCM raw audio from the client
      const pcm16Data = req.body;

      if (!pcm16Data || pcm16Data.length === 0) {
        return res.status(400).json({ error: 'No audio data' });
      }

      const API_KEY = process.env.ASSEMBLYAI_API_KEY || "ef4285f3bb4a4202975b5459c5ad163b";
      const urlParams = new URLSearchParams({
        sample_rate: '16000',
        speech_model: 'u3-rt-pro',
        format_turns: 'true',
        end_of_turn_confidence_threshold: '0.4',
        min_end_of_turn_silence_when_confident: '100',
        max_turn_silence: '1000',
        vad_threshold: '0.4',
        language_detection: 'true',
        u3_rt_pro_vad_threshold: '0.5'
      });

      const url = `wss://streaming.assemblyai.com/v3/ws?${urlParams.toString()}`;
      
      const ws = new WebSocket(url, {
        headers: {
          'Authorization': API_KEY
        }
      });

      let finalTranscript = "";
      let hasResponded = false;

      const respondWithError = (errorMsg: string) => {
        if (!hasResponded) {
          hasResponded = true;
          res.status(500).json({ error: errorMsg });
          ws.close();
        }
      };

      ws.on('open', () => {
        // Send the raw PCM chunk by chunk
        const chunkSize = 4096;
        for (let i = 0; i < pcm16Data.length; i += chunkSize) {
          ws.send(pcm16Data.subarray(i, i + chunkSize));
        }
        // Send termination message to end the turn and get the final transcript details
        ws.send(JSON.stringify({ type: "Terminate" }));
      });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          
          if (msg.type === "Turn") {
            const transcript = msg.transcript || '';
            // We want to accumulate formatted turns. Sometimes it sends unformatted partials, but format_turns should emit complete formatted chunks
            // if we are looking for the finalized turn:
            if (msg.turn_is_formatted) {
                finalTranscript += transcript + " ";
            } else if (!msg.turn_is_formatted && finalTranscript.length === 0) {
                // Keep the unformatted one just in case we terminate abruptly and it isn't formatted
                finalTranscript = transcript;
            }
          } else if (msg.type === "Termination") {
            if (!hasResponded) {
              hasResponded = true;
              res.json({ text: finalTranscript.trim() });
            }
            ws.close();
          } else if (msg.error) {
            console.error("AssemblyAI Error:", msg.error);
            respondWithError(msg.error);
          }
        } catch (e) {
          console.error("Error parsing message from AssemblyAI:", e);
        }
      });

      ws.on('error', (err) => {
        console.error("WebSocket Error:", err);
        respondWithError("WebSocket connection error to AssemblyAI");
      });

      // Timeout in case AssemblyAI never responds
      setTimeout(() => {
        if (!hasResponded) {
          respondWithError("Timed out waiting for AssemblyAI");
        }
      }, 30000);

    } catch (error) {
      console.error('Speech to text route error:', error);
      if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to transcribe audio' });
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      console.error(`CRITICAL ERROR: dist directory not found at ${distPath}`);
    } else {
      const indexPath = path.join(distPath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        console.error(`CRITICAL ERROR: index.html not found at ${indexPath}`);
      }
    }

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html: ${err}`);
          if (!res.headersSent) {
            res.status(500).send("Application shell not found. Please try again later.");
          }
        }
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
  });
}

startServer().catch(err => {
  console.error("Critical error during server startup:", err);
  process.exit(1);
});
