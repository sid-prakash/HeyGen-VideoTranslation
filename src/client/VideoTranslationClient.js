import axios from 'axios';
import { logger } from '../utils/logger.js';

export default class VideoTranslationClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.maxAttempts = options.maxAttempts || 20;
        this.initialDelay = options.initialDelay || 1000;   // 1 sec
        this.maxDelay = options.maxDelay || 15 * 1000;      // 15 sec
        this.timeout = options.timeout || 2 * 60 * 1000;    // 2 minute

        // Configure axios instance
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.info('API Response', {
                    status: response.status,
                    data: response.data
                });
                return response;
            },
            (error) => {
                logger.error('API Error', {
                    status: error.response?.status,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    #sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async #fetchStatus() {
        try {
            const response = await this.client.get('/status');
            return response.data.result;
        } catch (error) {
            throw new Error('Failed to GET /status from server');
        }
    }

    async #resetServer() {
        try {
            const response = await this.client.post('/reset');
            logger.info('Server reset successfully', { data: response.data });
            return response.data;
        } catch (error) {
            logger.error('Server reset failed', { message: error.message });
            throw new Error('Failed to reset the server');
        }
    }

    async getStatus() {
        // Reset server for every call to client
        await this.#resetServer();

        const startTime = Date.now();
        let attempt = 0;
        let delay = this.initialDelay;

        while (attempt < this.maxAttempts) {
            // Check for overall timeout
            if (Date.now() - startTime > this.timeout) {
                throw new Error('Operation timed out');
            }

            try {
                const result = await this.#fetchStatus();

                logger.info('Status check response', { attempt, result });

                if (result === 'completed' || result === 'error') {
                    return {
                        result,
                        attempts: attempt + 1
                    };
                }

                // If pending, wait and retry
                attempt++;
                await this.#sleep(delay);
                delay = Math.min(delay * 2, this.maxDelay);

            } catch (error) {
                logger.error('Status check error', {
                    attempt,
                    message: error.message
                });
                throw error;
            }
            console.log('');
        }

        throw new Error('Max retry attempts reached');
    }
}