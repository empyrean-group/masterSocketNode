const socketIO = require('socket.io');
const redis = require('redis');

const PORT = 3000; // Change this to your desired port number
const BLOCK_THRESHOLD = 100; // Number of connections per second threshold for blocking an IP
const BLOCK_EXPIRY = 300; // Expiry time for blocked IPs in seconds (5 minutes)

const acceptedWebApps = [
  { domain: "google.com", backends: ["http://google.com"] },
  { domain: "test.com", backends: ["http://2.2.2.2"] },
  // Add other accepted web applications here
];

const server = socketIO(PORT);

// Redis configuration
const redisClient = redis.createClient();

// Function to validate and sanitize the input
const isValidDomain = (domain) => {
  // Add more validation as per your requirements
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
};

server.on('connection', (socket) => {
  console.log('Reverse proxy server connected.');

  // Send the list of accepted web applications when a reverse proxy server connects
  socket.emit('data', JSON.stringify(acceptedWebApps));

  let systemInfoReceived = false;
  let systemInfoData = '';

  socket.on('data', (data) => {
    try {
      // Handle data received from the reverse proxy server if needed
      if (!systemInfoReceived) {
        // Check if the data is already parsed JSON or a string
        const newData = typeof data === 'object' ? data : JSON.parse(data);
        systemInfoData += JSON.stringify(newData); // Add to the systemInfoData string

        // Check if the systemInfoData contains the "systemInfo" property
        const parsedData = JSON.parse(systemInfoData);
        if (parsedData && parsedData.systemInfo) {
          console.log('Received systemInfo from reverse proxy:', JSON.stringify(parsedData.systemInfo, null, 2));
          // Process systemInfo data here if needed
          systemInfoReceived = true;
          return;
        }
      }

      // Assuming the data is an array of accepted web applications
      const parsedData = JSON.parse(data);
      console.log('Received data from reverse proxy:', parsedData);

      // Add necessary validation and authentication for the received data
      if (!Array.isArray(parsedData)) {
        throw new Error('Invalid data format received from reverse proxy. Expected an array.');
      }
      for (const app of parsedData) {
        if (!app.domain || !isValidDomain(app.domain) || !app.backends || !Array.isArray(app.backends)) {
          throw new Error('Invalid data format received from reverse proxy. Each object should have "domain" and "backends" properties, where "backends" is an array of backend server URLs.');
        }
      }
      console.log('Parsed data from reverse proxy:', parsedData);

      // Update the accepted web applications list based on the received data
      for (const app of parsedData) {
        acceptedWebApps.push(app);
      }
    } catch (error) {
      console.error('Error processing data from reverse proxy:', error.message);
    }
  });

  socket.on('childData', (data) => {
    try {
      // Assuming the data received contains the IP and connectionsPerSecond information
      const { ip, connectionsPerSecond } = typeof data === 'string' ? JSON.parse(data) : data;

      // Log the received data for monitoring purposes
      console.log(`Received connections per second from IP ${ip}: ${connectionsPerSecond}`);

      // Check if the number of connections per second exceeds the block threshold
      if (connectionsPerSecond > BLOCK_THRESHOLD) {
        // Block the IP using Redis with an expiry time of 5 minutes
        redisClient.setex(`blocked:${ip}`, BLOCK_EXPIRY, 'true', (err) => {
          if (err) {
            console.error(`Error blocking IP ${ip} in Redis:`, err.message);
          } else {
            console.log(`Blocked IP ${ip} for ${BLOCK_EXPIRY} seconds.`);
            // Broadcast the blocked IP to all child nodes
            server.emit('blockedIP', JSON.stringify(ip));
          }
        });
      }
    } catch (error) {
      console.error('Error processing data from child node:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Reverse proxy server disconnected.');
    // Optionally, you may want to gracefully shutdown the master node when the reverse proxy disconnects
    server.close(() => {
      console.log('Master socket node shut down gracefully.');
    });
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

console.log(`Master socket node started and listening on port ${PORT}`);

// Clean up the Redis connection when the master node is stopped
process.on('SIGINT', () => {
  redisClient.quit(() => {
    console.log('Redis connection closed.');
    process.exit(0);
  });
});
