import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import { AiOutlineDelete } from 'react-icons/ai';
import { BsCheckLg } from 'react-icons/bs';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';  // Riktig import
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import Routes

function App() {
  const [isCompleteScreen, setIsCompleteScreen] = useState(false);
  const [allTodos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [completedTodos, setCompletedTodos] = useState([]);
  const [allLists, setAllLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isRegisterScreen, setIsRegisterScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL;  // Get the API URL from the environment variable


  const validateToken = useCallback(() => {
    if (!token) return false;

    try {
      const decodedToken = jwtDecode(token);  // Bruk riktig import
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        localStorage.removeItem('token');
        setToken(null);
        return false;
      }
      return true;
    } catch (e) {
      localStorage.removeItem('token');
      setToken(null);
      return false;
    }
  }, [token]);

  const fetchLists = useCallback(async () => {
    if (!validateToken()) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/lists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllLists(response.data);
      setSelectedList(response.data.length > 0 ? response.data[0] : null);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, validateToken, apiUrl]);

  useEffect(() => {
    if (token) {
      fetchLists();
    }
  }, [token, fetchLists]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${apiUrl}/users/login`, {
        email: username,
        password,
      });
      const token = response.data.token;
      localStorage.setItem('token', token);
      setToken(token);
      alert('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      alert(error.response?.data?.message || 'Login failed. Please check your email and password.');
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post(`${apiUrl}/users/register`, {
        email: username,
        password,
      });
      alert('Registration successful. Please log in.');
      setIsRegisterScreen(false);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const handleAddTodo = async () => {
    if (!newTitle || !newDescription || !selectedList) {
      alert('Please select a list first');
      return;
    }

    try {
      const newTodo = { title: newTitle, description: newDescription, list_id: selectedList.list_id };
      
      // Fjerner 'response' som ikke er nødvendig
      await axios.post(`${apiUrl}/todos`, newTodo, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Hent alle todos på nytt etter å ha lagt til en ny
      const todosResponse = await axios.get(`${apiUrl}/todos?list_id=${selectedList.list_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(todosResponse.data);
      setNewTitle('');
      setNewDescription('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleComplete = async (index) => {
    const todo = allTodos[index];
    try {
      await axios.put(
        `${apiUrl}/todos/${todo.item_id}/complete`,
        { completed: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTodos(allTodos.filter((item, idx) => idx !== index));
      setCompletedTodos([...completedTodos, { ...todo, completed: true }]);
    } catch (error) {
      console.error('Error completing todo:', error);
    }
  };

  const handleDeleteFromCompleted = async (index) => {
    const todo = completedTodos[index];
    try {
      await axios.delete(`${apiUrl}/todos/${todo.item_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompletedTodos(completedTodos.filter((item, idx) => idx !== index));
    } catch (error) {
      console.error('Error deleting completed todo:', error);
    }
  };

  return (
    <Router>  {/* Wrap everything in Router */}
      <div className="App">
        <h1>My Todos</h1>
        <Routes> {/* Use Routes instead of Switch */}
          <Route path="/" element={
            !token ? (
              <div className="auth">
                <h2>{isRegisterScreen ? 'Register' : 'Login'}</h2>
                <input
                  type="text"
                  placeholder="Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {isRegisterScreen ? (
                  <button onClick={handleRegister} className="primaryBtn">Register</button>
                ) : (
                  <button onClick={handleLogin} className="primaryBtn">Login</button>
                )}
                <button onClick={() => setIsRegisterScreen(!isRegisterScreen)} className="secondaryBtn">
                  {isRegisterScreen ? 'Go to Login' : 'Go to Register'}
                </button>
              </div>
            ) : (
              <div className="todo-wrapper">
                {isLoading ? (
                  <p>Loading lists...</p>
                ) : (
                  <>
                    <div className="todo-input">
                      <div className="todo-input-item">
                        <label>Select List:</label>
                        <select
                          value={selectedList ? selectedList.list_id : ''}
                          onChange={(e) =>
                            setSelectedList(
                              allLists.find((list) => list.list_id === Number(e.target.value))
                            )
                          }
                        >
                          <option value="" disabled>
                            {allLists.length > 0 ? 'Select a list' : 'No lists available'}
                          </option>
                          {allLists.map((list) => (
                            <option key={list.list_id} value={list.list_id}>
                              {list.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="todo-input">
                      <div className="todo-input-item">
                        <label>Title</label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="What's the task title?"
                        />
                      </div>
                      <div className="todo-input-item">
                        <label>Description</label>
                        <input
                          type="text"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          placeholder="What's the description?"
                        />
                      </div>
                      <button type="button" onClick={handleAddTodo} className="primaryBtn">
                        Add
                      </button>
                    </div>
                    <div className="btn-area">
                      <button
                        className={`secondaryBtn ${!isCompleteScreen && 'active'}`}
                        onClick={() => setIsCompleteScreen(false)}
                      >
                        Todo
                      </button>
                      <button
                        className={`secondaryBtn ${isCompleteScreen && 'active'}`}
                        onClick={() => setIsCompleteScreen(true)}
                      >
                        Completed
                      </button>
                    </div>
                    <div className="todo-list">
                      {!isCompleteScreen &&
                        allTodos.map((item, index) => (
                          <div className="todo-list-item" key={item.item_id}>
                            <div>
                              <h3>{item.title}</h3>
                              <p>{item.description}</p>
                            </div>
                            <div>
                              <BsCheckLg className="check-icon" onClick={() => handleComplete(index)} />
                            </div>
                          </div>
                        ))}
                      {isCompleteScreen &&
                        completedTodos.map((item, index) => (
                          <div className="todo-list-item" key={item.item_id}>
                            <div>
                              <h3>{item.title}</h3>
                              <p>{item.description}</p>
                              <p>
                                <small>Completed on: {item.completed_time}</small>
                              </p>
                            </div>
                            <div>
                              <AiOutlineDelete
                                className="icon"
                                onClick={() => handleDeleteFromCompleted(index)}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
