import { 
  useState, 
  // useEffect 
} from "react";
import { useNavigate,Navigate  } from "react-router-dom";
import { useSelector,useDispatch } from "react-redux";
import { LOGIN_SUCCESS } from "../types";


const withRedirectIfLoggedIn = (Component) => (props) => {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  if (isAuthenticated ) {
    return <Navigate to="/" />;
  }

  return <Component {...props} />;
};


function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const history = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = (event) => {
    event.preventDefault();

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    };

    fetch("http://localhost:8000/api/token/", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        dispatch({ type: LOGIN_SUCCESS, payload: { access: data.access, refresh: data.refresh } });
        history("/");
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

export default withRedirectIfLoggedIn(Login);
