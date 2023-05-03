import React, { useEffect, useState } from "react";
import { useDispatch,useSelector } from "react-redux";
import { Navigate } from 'react-router-dom'
// import { login } from "../authSlice"
import {resetRegistered,login} from '../features/user';
import NavbarComponent from "./includes/Navbar";

const Login = () => {
  const dispatch = useDispatch();
  const { loading, isAuthenticated, registered } = useSelector(
    state => state.user
    );

  const [formData,setFormData] = useState({
    username: '',
    password: '',
  });

  useEffect(() => {
    if (registered) dispatch(resetRegistered());
  }, [registered]);

  const { username, password } = formData;

  const onChange = e => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

  const onSubmit = e => {
    e.preventDefault();
    dispatch(login({username,password}));
  };

  if (isAuthenticated) return <Navigate to='/' />;

  // const [username, setUsername] = useState("");
  // const [password, setPassword] = useState("");

  // const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  // console.log(isAuthenticated)
  // if (isAuthenticated) return <Navigate to='/' />;

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   dispatch(login({ username, password }));
  // };

  return (
    <>
      <NavbarComponent />
      <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">Login</div>
            <div className="card-body">
              {/* <form onSubmit={handleSubmit}> */}
              <form onSubmit={onSubmit}>
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    className="form-control"
                    type="text"
                    name='username'
                    onChange={onChange}                   
                    value={formData.username}
                    required
                    // onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    className="form-control"
                    type="password"
                    name='password'
                    onChange={onChange}
                    value={formData.password}
                    required                    
                    // onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {loading ? (
                  <div className='spinner-border text-primary' role='status'>
                    <span className='visually-hidden'>Loading...</span>
                  </div>
                ) : (
                  // <button className='btn btn-primary mt-4'>Login</button>
                  <button type="submit" className="btn btn-primary">Login</button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
