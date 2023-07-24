const socketIO = require('socket.io');

const PORT = 3000; // Change this to your desired port number

const acceptedWebApps = [
  { domain: "google.com", backend: "http://google.com" },
  { domain: "test.com", backend: "http://2.2.2.2" },
  // Add other accepted web applications here
];

const server = socketIO(PORT);

server.on('connection', (socket) => {
  console.log('Reverse proxy server connected.');

  // Send the list of accepted web applications when a reverse proxy server connects
  socket.emit('data', JSON.stringify(acceptedWebApps));

  socket.on('data', (data) => {
    try {
      // Handle data received from the reverse proxy server if needed
      const message = JSON.parse(data);
      // Add necessary validation and authentication for the received data
      if (!Array.isArray(message)) {
        throw new Error('Invalid data format received from reverse proxy. Expected an array.');
      }
      for (const app of message) {
        if (!app.domain || !isValidDomain(app.domain) || !app.backend) {
          throw new Error('Invalid data format received from reverse proxy. Each object should have "domain" and "backend" properties.');
        }
      }
      console.log('Received data from reverse proxy:', message);

      // Update the accepted web applications list based on the received data
      for (const app of message) {
        acceptedWebApps.push(app);
      }
    } catch (error) {
      console.error('Error processing data from reverse proxy:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Reverse proxy server disconnected.');
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

console.log(`Server started and listening on port ${PORT}`);
