import { VideoTranslationServer, app } from '../src/server/server.js';
import VideoTranslationClient from '../src/client/VideoTranslationClient.js';
import request from 'supertest';
import { jest } from '@jest/globals';

describe('Translation System Tests', () => {
    let serverInstance;
    let port;

    beforeAll((done) => {
        // Start server on a random available port
        serverInstance = app.listen(0, () => {
            port = serverInstance.address().port;
            console.log(`Test server running on port ${port}`);
            done();
        });
    });

    afterAll((done) => {
        // Ensure server is stopped after tests
        serverInstance.close(() => {
            console.log('Test server stopped');
            done();
        });
    });

    test('Server returns pending initially', async () => {
        const response = await request(app).get('/status');
        expect(response.status).toBe(200);
        expect(response.body.result).toBe('pending');
    });

    test('Client handles completion successfully', async () => {
        // Mock the server to always return completed
        jest.spyOn(VideoTranslationServer.prototype, 'getStatus').mockImplementationOnce(() => ({ 
            result: 'completed' 
        }));

        const client = new VideoTranslationClient({
            baseUrl: `http://localhost:${port}`,
            maxAttempts: 20,
            initialDelay: 1000,
            maxDelay: 5000,
            timeout: 10000,
        });

        const result = await client.getStatus();
        expect(result.result).toBe('completed');
    });

    test('Client handles server errors', async () => {
        // Mock the server to always return an error
        jest.spyOn(VideoTranslationServer.prototype, 'getStatus').mockImplementation(() => ({
            result: 'error',
        }));

        const client = new VideoTranslationClient({
            baseUrl: `http://localhost:${port}`,
            maxAttempts: 20,
            initialDelay: 1000,
            maxDelay: 5000,
            timeout: 10000,
        });

        const result = await client.getStatus();
        expect(result.result).toBe('error');
    });

    test('Client retries up to max attempts and times out', async () => {
        // Mock the server to always return pending
        jest.spyOn(VideoTranslationServer.prototype, 'getStatus').mockImplementation(() => ({
            result: 'pending',
        }));

        const client = new VideoTranslationClient({
            baseUrl: `http://localhost:${port}`,
            maxAttempts: 3, // Limit to 3 attempts
            initialDelay: 100,
            maxDelay: 200,
            timeout: 500,
        });

        await expect(client.getStatus()).rejects.toThrow('Max retry attempts reached');
    });

    test('resetServer fails with server error', async () => {
        const client = new VideoTranslationClient({
            baseUrl: `http://localhost:${port}`,
        });
    
        jest.spyOn(client.client, 'post').mockRejectedValueOnce(new Error('Server error on /reset'));
    
        await expect(client.getStatus()).rejects.toThrow('Failed to reset the server');
    });

    test('fetchStatus fails with server error', async () => {
        const client = new VideoTranslationClient({
            baseUrl: `http://localhost:${port}`,
        });
    
        jest.spyOn(client.client, 'get').mockRejectedValueOnce(new Error('Server error on /status'));
    
        await expect(client.getStatus()).rejects.toThrow('Failed to GET /status from server');
    });    
});
