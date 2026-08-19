const net = require('net');

const socket = new net.Socket();
socket.setTimeout(5000);

socket.connect(6543, 'aws-0-ap-south-1.pooler.supabase.com', () => {
  console.log('✅ Connected successfully!');
  socket.destroy();
});

socket.on('error', (err) => {
  console.log('❌ Connection failed:', err.message);
});

socket.on('timeout', () => {
  console.log('❌ Connection timed out');
  socket.destroy();
});