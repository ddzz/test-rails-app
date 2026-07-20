import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import NotFound from "./components/NotFound";
import TasksPage from "./components/TasksPage";

function App() {
  return (
    <main>
      <nav className="site-nav" aria-label="Main">
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink to="/tasks">Tasks</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}

export default App;
