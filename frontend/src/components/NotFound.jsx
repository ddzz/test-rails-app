import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>
        There is nothing at this address. <Link to="/">Back to the home page</Link>.
      </p>
    </section>
  );
}

export default NotFound;
