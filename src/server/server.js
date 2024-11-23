import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
    windowMs: process.env.RATELIMIT || 10 * 60 * 1000, // 10 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

export class VideoTranslationServer {
    constructor(options = {}) {
        this.delay = options.delay; // Time until completion
        this.errorProbability = options.errorProbability;
        this.startTime = Date.now();
        this.jobState = 'pending';
    }

    getStatus() {
        // Once state is set, return it
        if (this.jobState === 'completed' || this.jobState === 'error') {
            return { result: this.jobState };
        }

        if (Date.now() - this.startTime > this.delay) {
            // Simulate random errors
            this.jobState = Math.random() > this.errorProbability ? 'completed' : 'error';
        }

        return { result: this.jobState };
    }
}

let server = new VideoTranslationServer({
    delay: process.env.COMPLETION_DELAY || 5 * 10000,
    errorProbability: process.env.ERROR_PROBABILITY || 0.1
});

app.get('/status', (req, res) => {
    res.json(server.getStatus());
});

app.post('/reset', (req, res) => {
    server = new VideoTranslationServer({
        delay: process.env.COMPLETION_DELAY || 5 * 1000,
        errorProbability: process.env.ERROR_PROBABILITY || 0.1
    });
    res.json({ message: 'Server reset successfully' });
});

app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('');
    console.log(`Server starting with:`);
    console.log(`COMPLETION_DELAY: ${process.env.COMPLETION_DELAY || 5000}`);
    console.log(`ERROR_PROBABILITY: ${process.env.ERROR_PROBABILITY || 0.1}`);
});

export { app };