import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TodoLists({ token }) {
  const [todoLists, setTodoLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [selectedListId, setSelectedListId] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');

  // Hent todo-lister for brukeren
  useEffect(() => {
    const fetchTodoLists = async () => {
      try {
        const response = await axios.get('http://localhost:3001/todo-lists', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTodoLists(response.data);
      } catch (error) {
        console.error('Feil ved henting av todo-lister:', error);
      }
    };

    fetchTodoLists();
  }, [token]);

  // Opprett en ny liste
  const handleCreateList = async () => {
    try {
      const response = await axios.post(
        'http://localhost:3001/todo-lists',
        { list_name: newListName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTodoLists([...todoLists, response.data]);
      setNewListName('');
    } catch (error) {
      console.error('Feil ved oppretting av liste:', error);
    }
  };

  // Slett en liste
  const handleDeleteList = async (listId) => {
    try {
      await axios.delete(`http://localhost:3001/todo-lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodoLists(todoLists.filter((list) => list.list_id !== listId));
    } catch (error) {
      console.error('Feil ved sletting av liste:', error);
    }
  };

  // Velg en liste og hent oppgaver for den
  const handleSelectList = async (listId) => {
    setSelectedListId(listId);
    try {
      const response = await axios.get('http://localhost:3001/todos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos(response.data.filter((todo) => todo.list_id === listId));
    } catch (error) {
      console.error('Feil ved henting av oppgaver:', error);
    }
  };

  // Opprett en ny oppgave
  const handleAddTodo = async () => {
    if (!selectedListId) {
      alert('Velg en liste først.');
      return;
    }

    const newTodoItem = {
      title: newTodoTitle,
      description: newTodoDescription,
      list_id: selectedListId,
      due_time: new Date().toISOString(),
    };

    try {
      const response = await axios.post('http://localhost:3001/todos', newTodoItem, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodos([...todos, response.data]);
      setNewTodoTitle('');
      setNewTodoDescription('');
    } catch (error) {
      console.error('Feil ved oppretting av oppgave:', error);
    }
  };

  return (
    <div>
      <h1>Todo-lister</h1>
      <div>
        <input
          type="text"
          placeholder="Ny liste"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <button onClick={handleCreateList}>Opprett liste</button>
      </div>
      <ul>
        {todoLists.map((list) => (
          <li key={list.list_id}>
            <span onClick={() => handleSelectList(list.list_id)}>{list.list_name}</span>{' '}
            <button onClick={() => handleDeleteList(list.list_id)}>Slett</button>
          </li>
        ))}
      </ul>

      {selectedListId && (
        <div>
          <h2>Oppgaver for valgt liste</h2>
          <div>
            <input
              type="text"
              placeholder="Oppgavetittel"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Beskrivelse"
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
            />
            <button onClick={handleAddTodo}>Legg til oppgave</button>
          </div>
          <ul>
            {todos.map((todo) => (
              <li key={todo.item_id}>
                {todo.title}: {todo.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TodoLists;
