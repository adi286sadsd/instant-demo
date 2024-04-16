'use client'

import React, { useEffect } from 'react'
import { init, tx, id, Cursors } from '@instantdb/react'

// Visit https://instantdb.com/dash to get your APP_ID :)
const APP_ID = 'eec1b2fb-8f19-43d8-b6d0-d5f6b6bc188d'

// Optional: Declare your schema for intellisense!
type Schema = {
  issues: Issue,
  users: User
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

// A concrete example
type RoomSchema = {
  chat: {
    presence: { name: string;};
    topics: {
      reaction: { emoji: string };
    };
  };
}

const randomId = Math.random().toString(36).slice(2, 6);
const u = {
  // name: `${randomId}`,
  name: 'saurav',
};


const db = init<Schema>({ appId: APP_ID })

// @ts-ignore
const room = db.room('video', '123') 

const user_id = 'f70f8f27-45d9-4cba-9a79-177a8e06aed2';

function App() {
  // Read Data
  const { isLoading, error, data } = db.useQuery({ issues: { author: {} } })

  const { user, peers, publishPresence } = room.usePresence()

  useEffect(() => {
    console.log("user id is " + user_id + 'is loading ' + isLoading)
      addUser()
  }, [])

  useEffect(() => {
      // @ts-ignore
    publishPresence(u)

  }, [user])
  
  if (isLoading) {
    // addUser('saurav')
    return <div>Fetching data...</div>
  }
  if (error) {
    return <div>Error fetching data: {error.message}</div>
  }

  console.log('Data is ' + JSON.stringify(data))

  const { issues, users } = data

  console.log("issues are " + JSON.stringify(issues))

  console.log('Users are ' + JSON.stringify(users))
  
  return (
    // @ts-ignore
    <Cursors room={room} currentUserColor="blue">
    <div style={styles.container}>
      <span>who is online ? {user.name} </span>
      
      <div style={styles.header}>issues</div>
      <IssueForm issues={issues} />
      <IssueList issues={issues} />
      <ActionBar issues={issues} />
      <div style={styles.footer}>
        Open another tab to see issues update in realtime!
      </div>
    </div>
    </Cursors>
  )

  
}



function InstantTypingIndicator() {
  // 1. Set your presence in the room 
  // @ts-ignore
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
        // @ts-ignore
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

function addIssue(text: string) {
  db.transact(
    tx.issues[id()].update({
      text,
      done: false,
      createdAt: Date.now(),
    }).link({author: user_id})
  )
}

function addUser() {
  console.log("user id is asdf " + user_id)
  db.transact(
    tx.users[user_id].update({
      email: u.name,
      handle: u.name,
    })
  )
}

function deleteIssue(issue: Issue) {
  db.transact(tx.issues[issue.id].delete())
}

function toggleDone(issue: Issue) {
  db.transact(tx.issues[issue.id].update({ done: !issue.done }))
}

function deleteCompleted(issues: Issue[]) {
  const completed = issues.filter((issue) => issue.done)
  const txs = completed.map((issue) => tx.issues[issue.id].delete())
  db.transact(txs)
}

function toggleAll(issues: Issue[]) {
  const newVal = !issues.every((issue) => issue.done)
  db.transact(issues.map((issue) => tx.issues[issue.id].update({ done: newVal })))
}

// Components
// ----------
function IssueForm({ issues }: { issues: Issue[] }) {
  return (
    <div style={styles.form}>
      <div style={styles.toggleAll} onClick={() => toggleAll(issues)}>
        ⌄
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          addIssue(e.target[0].value)
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

function IssueList({ issues }: { issues: Issue[] }) {
  console.log("issue is " + JSON.stringify(issues)) 
  return (
    <div style={styles.issueList}>
      {issues.map((issue) => (
        <div key={issue.id} style={styles.issue}>
          <input
            type="checkbox"
            key={issue.id}
            style={styles.checkbox}
            checked={issue.done}
            onChange={() => toggleDone(issue)}
          />
          <div style={styles.issueText}>
            {issue.done ? (
              <span style={{ textDecoration: 'line-through' }}>
                {issue.text} Created by {issue.author?.email}
              </span>
            ) : (
              <span>{issue.text} Created by {issue.author?.email}</span>
            )}
          </div>
          <span onClick={() => deleteIssue(issue)} style={styles.delete}>
            𝘟
          </span>
        </div>
      ))}
    </div>
  )
}

function ActionBar({ issues }: { issues: Issue[] }) {
  return (
    <div style={styles.actionBar}>
      <div>Remaining issues: {issues.filter((issue) => !issue.done).length}</div>
      <div style={{ cursor: 'pointer' }} onClick={() => deleteCompleted(issues)}>
        Delete Completed
      </div>
    </div>
  )
}

// Types
// ----------
type Author = {
  id: string
  email : string
  handle : string

}
type Issue = {
  id: string
  text: string
  done: boolean
  createdAt: number
  author : User
}

type User = {
  id: string
  email : string
  handle : string
}

// users {
//   id: UUID,
//   email: string :is_unique,
//   handle: string :is_unique :is_indexed,
//   createdAt: number,
//   :has_many issues
//   :has_many comments
// }

// issues {
//   id: UUID,
//   text: string,
//   createdAt: number,
//   :has_many comments,
//   :belongs_to author :through users,
// }

// comments {
//   id: UUID,
//   text: string,
//   :belongs_to issue,
//   :belongs_to author :through users
// }


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
  issueList: {
    boxSizing: 'inherit',
    width: '350px',
  },
  checkbox: {
    fontSize: '30px',
    marginLeft: '5px',
    marginRight: '20px',
    cursor: 'pointer',
  },
  issue: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    border: '1px solid lightgray',
    borderBottomWidth: '0px',
  },
  issueText: {
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