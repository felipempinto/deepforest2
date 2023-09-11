import React, { useEffect, useState } from "react";
import { useDispatch,useSelector } from "react-redux";
import { Navigate } from 'react-router-dom'
// import { login } from "../authSlice"
import {resetRegistered,login} from '../features/user';
import NavbarComponent from "./includes/Navbar";
import M from 'materialize-css';

const Login = () => {
  const [loginError, setLoginError] = useState('');
  const dispatch = useDispatch();
  const { loading, isAuthenticated, registered } = useSelector(
    state => state.user
    );

  const [formData,setFormData] = useState({
    username: '',
    password: '',
  });

  useEffect(() => {
    M.AutoInit();
  }, []);
  

  useEffect(() => {
    if (registered) dispatch(resetRegistered());
  }, [registered]);

  const { username, password } = formData;

  const onChange = e => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};
  const onSubmit = e => {
    e.preventDefault();
    dispatch(login({ username, password }))
      .then(data => {
        if (data.meta.requestStatus==='rejected') {
          setLoginError(data.payload.detail);
        } else {
          console.log("SUCESS")
          // M.toast({html: 'I am a toast!'})     
          M.toast(
            {html: "IDAFSDFADFASDASDVASDV", 
             classes: 'orange rounded', 
             displayLength:10000
            }
             );
        }        
      })
      .catch(error => {
        console.error('Login error:', error);
      });
  };
  
  // if (isAuthenticated) return <Navigate to='/' />;
  if (typeof isAuthenticated !== 'undefined' && isAuthenticated) {
    return <Navigate to="/requests" />;
  }
  


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
                {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
                {loading ? (
                  <div className='spinner-border text-primary' role='status'>
                    <span className='visually-hidden'>Loading...</span>
                  </div>
                ) : (
                  // <button className='btn btn-primary mt-4'>Login</button>
                  <button type="submit" className="btn btn-primary">Login</button>
                )}
                 <a onclick="M.toast({html: 'I am a toast'})" class="btn">Toast!</a>
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
