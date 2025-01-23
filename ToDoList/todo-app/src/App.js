import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import { AiOutlineDelete } from 'react-icons/ai';
import { BsCheckLg } from 'react-icons/bs';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Importer jwt-decode

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
  const [token, setToken] = useState(null);
  const [isRegisterScreen, setIsRegisterScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For å håndtere loading-tilstand

  const handleAddTodo = async () => {
    if (!selectedList) {
      alert('Please select a list first.');
      return;
    }

    const newTodoItem = {
      title: newTitle,
      description: newDescription,
      list_id: selectedList.list_id,
      due_time: new Date().toISOString(),
    };

    try {
      const response = await axios.post('http://localhost:3001/todos', newTodoItem, {
        headers: { Authorization: `Bearer ${token}` },  // Bruk tokenet fra localStorage
      });
      const savedTodo = response.data;
      setTodos([...allTodos, savedTodo]);
      setNewTitle('');
      setNewDescription('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleDeleteFromCompleted = async (index) => {
    const todoToDelete = completedTodos[index];
    if (!todoToDelete || !todoToDelete.item_id) {
      console.error('Error: item_id missing in todoToDelete:', todoToDelete);
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/todos/${todoToDelete.item_id}`, {
        headers: { Authorization: `Bearer ${token}` },  // Bruk tokenet fra localStorage
      });
      const updatedCompletedTodos = completedTodos.filter((_, i) => i !== index);
      setCompletedTodos(updatedCompletedTodos);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleComplete = async (index) => {
    const todoToComplete = allTodos[index];
    try {
      const response = await axios.put(
        `http://localhost:3001/todos/${todoToComplete.item_id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }  // Bruk tokenet fra localStorage
      );

      const updatedTodos = allTodos.filter((_, i) => i !== index);
      setTodos(updatedTodos);
      setCompletedTodos([...completedTodos, response.data]);
    } catch (error) {
      console.error('Error completing todo:', error);
    }
  };

  const fetchLists = useCallback(async () => {
    setIsLoading(true);  // Start loading
    try {
      const response = await axios.get('http://localhost:3001/lists', {
        headers: { Authorization: `Bearer ${token}` },  // Bruk tokenet fra localStorage
      });
      console.log('Lists fetched from backend:', response.data); // Debugging
      setAllLists(response.data);
      if (response.data.length > 0) {
        setSelectedList(response.data[0]); // Velg første liste som standard
      } else {
        setSelectedList(null);
        alert('No lists found. Please create a new list.');
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }, [token]);

  const fetchTodos = useCallback(async () => {
    if (!selectedList) return;
    try {
      const response = await axios.get('http://localhost:3001/todos', {
        headers: { Authorization: `Bearer ${token}` },  // Bruk tokenet fra localStorage
        params: { list_id: selectedList.list_id },
      });
      setTodos(response.data.filter((todo) => !todo.completed));
      setCompletedTodos(response.data.filter((todo) => todo.completed));
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }, [selectedList, token]);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3001/users/login', {
        email: username,
        password,
      });
      console.log('Token:', response.data.token); // Debugging

      const token = response.data.token;

      // Dekode JWT-tokenet for å sjekke utløpstid
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Nåværende tid i sekunder

      // Sjekk om tokenet har utløpt
      if (decodedToken.exp < currentTime) {
        alert('Token has expired');
        return; // Avslutt login prosessen hvis tokenet er utløpt
      }

      // Lagre tokenet i localStorage
      localStorage.setItem('token', token);
      setToken(token);  // Sett token i frontend state

      alert('Login successful!');
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed. Please check your email and password.');
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post('http://localhost:3001/users/register', {
        email: username,
        password,
      });
      alert('Registration successful. Please log in.');
      setIsRegisterScreen(false);
    } catch (error) {
      console.error('Error registering:', error);
      alert('Registration failed. Please try again.');
    }
  };

  useEffect(() => {
    if (token) {
      fetchLists();
    }
  }, [token, fetchLists]);

  useEffect(() => {
    if (selectedList) {
      fetchTodos();
    }
  }, [selectedList, fetchTodos]);

  return (
    <div className="App">
      <h1>My Todos</h1>

      {!token ? (
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
            <button onClick={handleRegister} className="primaryBtn">
              Register
            </button>
          ) : (
            <button onClick={handleLogin} className="primaryBtn">
              Login
            </button>
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
      )}
    </div>
  );
}

export default App;
