import { useEffect, useRef, useState } from 'react';
import './App.css';
import { toast } from 'react-toastify';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

interface ResponseInterface {
  type: string;
  payload: {
    roomId?: string;
    message?: string;
  };
}

function App() {
  const socketRef = useRef<WebSocket | null>(null); // useRef for WebSocket
  const messageRef = useRef<HTMLInputElement | null>(null); // useRef for message input
  const [join, setJoin] = useState<string>('');
  const [serverMessage, setServerMessage] = useState<string[]>(['Hi There']);

  function getResponse({ type, payload }: { type: string; payload: { roomId?: string; message?: string } }): ResponseInterface {
    return { type, payload };
  }

  function joinHandler() {
    if (!socketRef.current) {
      console.error('WebSocket is not connected');
      return;
    }

    const message = messageRef.current?.value.trim();
    if (!message) return;

    const type = 'join';
    const payload = { roomId: message }; // Using `message` as the roomId
    const response = getResponse({ type, payload });

    socketRef.current.send(JSON.stringify(response));
    setJoin(message);

    if (messageRef.current) messageRef.current.value = ''; // Clear input field
  }

  function sendMessage() {
    if (!socketRef.current) {
      console.error('WebSocket is not connected');
      return;
    }

    const message = messageRef.current?.value.trim();
    if (!message) return;

    const type = 'chat';
    const payload = { message };
    const response = getResponse({ type, payload });

    socketRef.current.send(JSON.stringify(response));

    if (messageRef.current) messageRef.current.value = ''; // Clear input field
  }

  useEffect(() => {

    socketRef.current = new WebSocket(WEBSOCKET_URL);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "notification") {
        toast.info(data.payload.message); // Show notification for everyone in the room
      } else if (data.type === "chat") {
        setServerMessage((prev) => [...prev, data.payload.message]);
      }
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      socketRef.current?.close();
    };
  }, []);

  return (
    <>
      <p>Simple Chat App</p>
      <div style={{ display: 'flex', flexDirection: 'column', columnGap: '10px' }}>
        <div style={{ height: '75vh', overflow:"scroll" , bottom: '0px', textAlign: 'start' }}
        className='hide-scrollbar'>
          {serverMessage.length > 0 &&
            serverMessage.map((message, index) => (
              <p
                key={index}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  height: '30px',
                  paddingLeft: '10px',
                }}
              >
                {message}
              </p>
            ))}
        </div>

        <div style={{ display: 'flex' }}>
          <input
            type="text"
            placeholder="Write message"
            ref={messageRef} // Using useRef here
            style={{ height: '40px', width: '50vw' }}
          />
          {join !== '' ? (
            <button onClick={sendMessage} style={{ width: '20vw', height: '45px' }}>
              Send
            </button>
          ) : (
            <button onClick={joinHandler} style={{ width: '20vw', height: '45px' }}>
              Join
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
