// frontend/src/PhoneView.jsx
import { useEffect, useState, useRef, useCallback } from 'react';

function PhoneView() {
  const [status, setStatus] = useState('Connecting...');
  const [isConnected, setIsConnected] = useState(false);
  const [clickFeedback, setClickFeedback] = useState('');
  const ws = useRef(null);
  const lastSentTime = useRef(0);

  const sendCommand = useCallback((command) => {
    const now = Date.now();
    if (now - lastSentTime.current < 1) {
      setClickFeedback('⚠️ Slow down!');
      setTimeout(() => setClickFeedback(''), 500);
      return;
    }
    lastSentTime.current = now;

    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(command);
        console.log(`Sent command: ${command}`);
      } catch (error) {
        console.error('Error sending command:', error);
        setStatus('⚠️ Send Error');
      }
    } else {
      setStatus('⚠️ Not connected');
    }
  }, []);

  useEffect(() => {
    const host = window.location.hostname;
    const wsUrl = `ws://${host}:3000`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setStatus('✅ Connected to Desktop!');
      setIsConnected(true);
      ws.current.send('PHONE_CONNECTED');
    };

    ws.current.onerror = (error) => {
      setStatus('❌ Connection Error');
      setIsConnected(false);
    };

    ws.current.onclose = () => {
      setStatus('📴 Disconnected');
      setIsConnected(false);
    };

    return () => ws.current?.close();
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
      <h2>📱 Phone Controller</h2>
      <p style={{ color: isConnected ? 'green' : 'red', fontWeight: 'bold' }}>
        Status: {status} {clickFeedback}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 30 }}>
        <div></div>
        <button onClick={() => sendCommand('ARROW_UP')} style={{ padding: 15 }}>↑</button>
        <div></div>
        <button onClick={() => sendCommand('ARROW_LEFT')} style={{ padding: 15 }}>←</button>
        <button onClick={() => sendCommand('CLICK')} style={{ padding: 15 }}>Click</button>
        <button onClick={() => sendCommand('ARROW_RIGHT')} style={{ padding: 15 }}>→</button>
        <div></div>
        <button onClick={() => sendCommand('ARROW_DOWN')} style={{ padding: 15 }}>↓</button>
        <div></div>
      </div>

      <div style={{ marginTop: 30 }}>
        <input
          type="text"
          placeholder="Type to send keys..."
          onKeyDown={(e) => sendCommand(`KEY_${e.key.toUpperCase()}`)}
          style={{ padding: 10, width: '100%' }}
        />
      </div>
    </div>
  );
}

export default PhoneView;