import { useState } from "react";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    };

    fetch("/api/token/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        // Redirect to dashboard or other protected page
      })
      .catch((error) => console.log(error));
  };

  return (
    <div className="container">
        <form onSubmit={handleLogin}>
        <label>
            Username:
            <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            />
        </label>
        <label>
            Password:
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
        </label>
        <button type="submit">Login</button>
        </form>
    </div>
  );
}

export default Login;