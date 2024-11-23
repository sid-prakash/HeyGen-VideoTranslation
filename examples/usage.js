import VideoTranslationClient from '../src/client/VideoTranslationClient.js';

console.log('Usage script started...');
const port = process.env.PORT || '3000'

async function main() {
    const client = new VideoTranslationClient({
        baseUrl: 'http://localhost:{port}',
        maxAttempts: 20,
        initialDelay: 1000,     // 1 sec
        maxDelay: 15 * 1000,    // 15 sec  
        timeout: 2 * 60 * 1000  // 2 min
    });

    try {
        const result = await client.getStatus();
        console.log('Translation completed:', result);
    } catch (error) {
        console.error('Translation failed:', error.message);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}