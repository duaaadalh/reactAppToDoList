import React, { useState } from 'react';
import axios from 'axios';

function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3001/users/login', { email, password });
      alert('Innlogging vellykket!');
      setToken(response.data.token); // Setter token i App
    } catch (error) {
      console.error('Feil ved innlogging:', error);
      alert('Feil e-post eller passord.');
    }
  };

  return (
    <div>
      <h2>Logg Inn</h2>
      <input
        type="email"
        placeholder="E-post"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Passord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Logg Inn</button>
    </div>
  );
}

export default Login;
