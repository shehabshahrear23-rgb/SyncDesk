
import { useState } from "react";
import ProjectWorkspace from "./routes/projectWorkspace";
import SprintWorkspace from "./routes/sprintWorkspace";
import OperationWorkspace from "./routes/operationWorkspace";

const tabs = {
  Project: ProjectWorkspace,
  Sprint: SprintWorkspace,
  Operation: OperationWorkspace,
};

export default function App() {
  const [tab, setTab] = useState<keyof typeof tabs>("Project");
  const Page = tabs[tab];

  return (
    <div>
      <nav style={{ display: "flex", gap: 8, padding: 8 }}>
        {Object.keys(tabs).map((name) => (
          <button key={name} onClick={() => setTab(name as keyof typeof tabs)}>
            {name}
          </button>
        ))}
      </nav>
      <Page />
    </div>
  );
}
