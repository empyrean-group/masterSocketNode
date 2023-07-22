const socketIO = require('socket.io');

const PORT = 3000; // Change this to your desired port number

const acceptedWebApps = [
  { domain: "google.com" },
  { domain: "test.com" },
  // Add other accepted web applications here
];

const server = socketIO(PORT); // Use socketIO here

server.on('connection', (socket) => {
  console.log('Reverse proxy server connected.');

  // Send the list of accepted web applications when a reverse proxy server connects
  socket.emit('data', JSON.stringify(acceptedWebApps));

  socket.on('data', (data) => {
    // Handle data received from the reverse proxy server if needed
    // For example, you can parse the data as JSON and perform actions accordingly
    const message = data.toString().trim();
    console.log('Received data from reverse proxy:', message);
  });

  socket.on('disconnect', () => {
    console.log('Reverse proxy server disconnected.');
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

console.log(`Server started and listening on port ${PORT}`);
