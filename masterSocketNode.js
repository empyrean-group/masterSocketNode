const net = require('net');

const PORT = 3000; // Change this to your desired port number

const acceptedWebApps = [
  { domain: "google.com" },
  { domain: "test.com" },
  // Add other accepted web applications here
];

const server = net.createServer((socket) => {
  console.log('Reverse proxy server connected.');

  // Send the list of accepted web applications when a reverse proxy server connects
  socket.write(JSON.stringify(acceptedWebApps));

  socket.on('data', (data) => {
    // Handle data received from the reverse proxy server if needed
    // For example, you can parse the data as JSON and perform actions accordingly
    const message = data.toString().trim();
    console.log('Received data from reverse proxy:', message);
  });

  socket.on('end', () => {
    console.log('Reverse proxy server disconnected.');
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Server started and listening on port ${PORT}`);
});
