import { Link } from "react-router-dom";

function Home() {
  return (
    <section>
      <h1>Home</h1>
      <p>Nothing here yet — a new feature is on its way.</p>
      <p>
        In the meantime, <Link to="/tasks">go to your tasks</Link>.
      </p>
    </section>
  );
}

export default Home;
