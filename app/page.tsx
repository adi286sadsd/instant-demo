'use client'

import React, { useEffect } from 'react'
import { init, tx, id, Cursors } from '@instantdb/react'

// Visit https://instantdb.com/dash to get your APP_ID :)
const APP_ID = 'eec1b2fb-8f19-43d8-b6d0-d5f6b6bc188d'

// Optional: Declare your schema for intellisense!
type Schema = {
  todos: Todo
}

// Generic type for room schemas.
// type RoomSchemaShape = {
//   [roomType: string]: {
//     presence?: { [k: string]: any };
//     topics?: {
//       [topic: string]: {
//         [k: string]: any;
//       };
//     };
//   };
// };

// // A concrete example
// type RoomSchema {
//   video: {
//     presence: { handle: string; avatarUrl: string; color: string };
//     topics: {
//       reaction: { emoji: string };
//     };
//   };
// }


const db = init<Schema>({ appId: APP_ID })

const room = db.room('video', '123')

const randomId = Math.random().toString(36).slice(2, 6);
const user = {
  name: `${randomId}`,
};


function App() {
  // Read Data
  const { isLoading, error, data } = db.useQuery({ todos: {} })

  const { user, peers, publishPresence } = room.usePresence()


  useEffect(() => {
    publishPresence(user)
  }, [user])

  const publishEmote = room.usePublishTopic('emotes')
  
  room.useTopicEffect('emotes', (event, peer) => {
    // Render broadcasted emotes!
    alert("emoji is clicked!")
  })

  
  if (isLoading) {
    return <div>Fetching data...</div>
  }
  if (error) {
    return <div>Error fetching data: {error.message}</div>
  }


  

  const { todos } = data
  return (
    <Cursors room={room} currentUserColor="blue">
    <div style={styles.container}>
      <span>{user.name}</span>
    <button onClick={() => publishEmote({ emoji: '🔥' })}>🔥</button>
      <div style={styles.header}>todos</div>
      <TodoForm todos={todos} />
      <TodoList todos={todos} />
      <ActionBar todos={todos} />
      <div style={styles.footer}>
        Open another tab to see todos update in realtime!
      </div>
      <InstantTypingIndicator/>
    </div>
    </Cursors>
  )

  
}




function InstantTypingIndicator() {
  // 1. Set your presence in the room
  room.useSyncPresence(user);

  // 2. Use the typing indicator hook
  const typing = room.useTypingIndicator('chat');

  const onKeyDown = (e) => {
    // 3. Render typing indicator
    typing.inputProps.onKeyDown(e);

    // 4. Optionally run your own onKeyDown logic
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Message sent:', e.target.value);
    }
  };

  return (
    <div className="flex h-screen gap-3 p-2">
      <div key="main" className="flex flex-1 flex-col justify-end">
        <textarea
          onKeyBlur={typing.inputProps.onBlur}
          onKeyDown={onKeyDown}
          placeholder="Compose your message here..."
          className="w-full rounded-md border-gray-300 p-2 text-sm"
        />
        <div className="truncate text-xs text-gray-500">
          {typing.active.length ? typingInfo(typing.active) : <>&nbsp;</>}
        </div>
      </div>
    </div>
  );
}

function typingInfo(users) {
  if (users.length === 0) return null;
  if (users.length === 1) return `${users[0].name} is typing...`;
  if (users.length === 2)
    return `${users[0].name} and ${users[1].name} are typing...`;

  return `${users[0].name} and ${users.length - 1} others are typing...`;
}


// Write Data
// ---------
function addTodo(text: string) {
  db.transact(
    tx.todos[id()].update({
      text,
      done: false,
      createdAt: Date.now(),
    })
  )
}

function deleteTodo(todo: Todo) {
  db.transact(tx.todos[todo.id].delete())
}

function toggleDone(todo: Todo) {
  db.transact(tx.todos[todo.id].update({ done: !todo.done }))
}

function deleteCompleted(todos: Todo[]) {
  const completed = todos.filter((todo) => todo.done)
  const txs = completed.map((todo) => tx.todos[todo.id].delete())
  db.transact(txs)
}

function toggleAll(todos: Todo[]) {
  const newVal = !todos.every((todo) => todo.done)
  db.transact(todos.map((todo) => tx.todos[todo.id].update({ done: newVal })))
}

// Components
// ----------
function TodoForm({ todos }: { todos: Todo[] }) {
  return (
    <div style={styles.form}>
      <div style={styles.toggleAll} onClick={() => toggleAll(todos)}>
        ⌄
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          addTodo(e.target[0].value)
          e.target[0].value = ''
        }}
      >
        <input
          style={styles.input}
          autoFocus
          placeholder="What needs to be done?"
          type="text"
        />
      </form>
    </div>
  )
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div style={styles.todoList}>
      {todos.map((todo) => (
        <div key={todo.id} style={styles.todo}>
          <input
            type="checkbox"
            key={todo.id}
            style={styles.checkbox}
            checked={todo.done}
            onChange={() => toggleDone(todo)}
          />
          <div style={styles.todoText}>
            {todo.done ? (
              <span style={{ textDecoration: 'line-through' }}>
                {todo.text}
              </span>
            ) : (
              <span>{todo.text}</span>
            )}
          </div>
          <span onClick={() => deleteTodo(todo)} style={styles.delete}>
            𝘟
          </span>
        </div>
      ))}
    </div>
  )
}

function ActionBar({ todos }: { todos: Todo[] }) {
  return (
    <div style={styles.actionBar}>
      <div>Remaining todos: {todos.filter((todo) => !todo.done).length}</div>
      <div style={{ cursor: 'pointer' }} onClick={() => deleteCompleted(todos)}>
        Delete Completed
      </div>
    </div>
  )
}

// Types
// ----------
type Todo = {
  id: string
  text: string
  done: boolean
  createdAt: number
}

// Styles
// ----------
const styles: Record<string, React.CSSProperties> = {
  container: {
    boxSizing: 'border-box',
    backgroundColor: '#fafafa',
    fontFamily: 'code, monospace',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  header: {
    letterSpacing: '2px',
    fontSize: '50px',
    color: 'lightgray',
    marginBottom: '10px',
  },
  form: {
    boxSizing: 'inherit',
    display: 'flex',
    border: '1px solid lightgray',
    borderBottomWidth: '0px',
    width: '350px',
  },
  toggleAll: {
    fontSize: '30px',
    cursor: 'pointer',
    marginLeft: '11px',
    marginTop: '-6px',
    width: '15px',
    marginRight: '12px',
  },
  input: {
    backgroundColor: 'transparent',
    fontFamily: 'code, monospace',
    width: '287px',
    padding: '10px',
    fontStyle: 'italic',
  },
  todoList: {
    boxSizing: 'inherit',
    width: '350px',
  },
  checkbox: {
    fontSize: '30px',
    marginLeft: '5px',
    marginRight: '20px',
    cursor: 'pointer',
  },
  todo: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    border: '1px solid lightgray',
    borderBottomWidth: '0px',
  },
  todoText: {
    flexGrow: '1',
    overflow: 'hidden',
  },
  delete: {
    width: '25px',
    cursor: 'pointer',
    color: 'lightgray',
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '328px',
    padding: '10px',
    border: '1px solid lightgray',
    fontSize: '10px',
  },
  footer: {
    marginTop: '20px',
    fontSize: '10px',
  },
}

export default App