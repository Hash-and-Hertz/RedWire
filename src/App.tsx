import { useState } from "react";
import reactLogo from "./assets/react.svg"; // left over from start
import { invoke } from "@tauri-apps/api/core"; // left over from start
import "./App.css";
import DottedGraph from "./DottedGraph"; // represents the graph UI logic
import { NodeData } from "./GraphComponents/types"; // this is where we will hold basic data types for the graph, may divide up in the future and hence a folder


// This is where all the front end starts, the top layer. 


const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]); // here will hold the top layer data until we move it later for better organization

  return (
    <DottedGraph // represents the graph UI logic
      nodes={nodes} // Nodes data passed from top layer state 
      onAddNode={(node) => setNodes((prev) => [...prev, node])} // Handles adding new nodes to the state
    />
  );
};

export default App; // exporting to use the app!
