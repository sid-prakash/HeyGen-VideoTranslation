# HeyGen - Video Translation Client and Server Simulation

This porject demonstrates a simulated video translation system with a server and client library. The server provides the endpoint to check the status of the video translation. The status GET /status can be 'pending', 'completed', or 'error'.

## Requirements

- **Node.js**: v14 or higher
- **npm**: v6 or higher

## How to use

1. Clone the repository
2. Install dependencies: run 'npm i'
3. Configure .env file (note I already have default values, please feel free to configure as needed)
    - .env file has 5 values that can be configured
        - PORT: Server port
        - COMPLETION_DELAY: Time (in ms) after which the translation completed
        - ERROR_PROBABILITY: Probability (0-1) of the server returning an error
        - RATELIMIT: Time (in ms). Limits each IP to 100 requests per RATELIMIT

4. Start the server: run 'npm start'. The server will be availabe at http://localhost:300
5. Run the example script
    - run 'npm run example'
    - This script is in /examples/usage.js
    - This script simulates using the client library. Every time you run 'npm run example', it is like uploading a new video to translate and process.

---

## My approach

The problem: In the trivial approach, if the user calls the API frequently, there is a cost, or if the calls are too slow, there will be unnecessary delays in getting the status.

My Solution:
- Use a rate limit from 'express-rate-limit' which limits the amount of time a client can call the API. This limit is set in /src/server/server.js. This limit can also be modified in the .env file. For example, the RATELIMIT in .env is set to 10 * 60 * 1000 (10 mins). This means that the user can only call the API 100 times in 10 mins. 
- Use a initialDelay and maxDelay. To reduce the number of times the client library calles the server, I have also implemented a initialDelay and maxDelay. The client library calls the API then after the initialDelay, the delay is multiplied by 2. This happens for each iteration where the status is 'pending'. To ensure that the calls are not too slow, I have maxDelay which is the max delay that happens between each API call. This logic is in /src/client/VideoTranslationClient

---

## Features

- Express.js for the server and Axios for the client library
- Helmet and CORS for imporved security
- DOTenv for configuration
- express-rate-limit for rate limit
- Winston for logging