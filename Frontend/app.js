// src/App.jsx
import React, { useState } from "react";
import MessList from "./components/MessList";
import AddMessForm from "./components/AddMessForm";

function App() {
  const [refresh, setRefresh] = useState(false);

  const handleMessAdded = () => {
    setRefresh(!refresh); // toggle to trigger refresh
  };

  return (
    <div className="App">
      <h1>MessMate – Manage Mess Listings</h1>
      <AddMessForm onMessAdded={handleMessAdded} />
      <hr />
      <MessList refresh={refresh} />
    </div>
  );
}

export default App;
