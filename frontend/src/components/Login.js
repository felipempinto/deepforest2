import React, { 
    // useEffect, 
    useState 
} from "react";

import NavbarComponent from "./includes/Navbar";
import M from 'materialize-css';
import './Login.css'
import { 
  useDispatch, 
  // useSelector 
} from 'react-redux';
import {
  // resetRegistered,
  login
} from '../features/user';


const Login = () => {
    const [formData,setFormData] = useState({
        username:'',
        password:'',
    });
    const dispatch = useDispatch();
    
    const onSubmit = e => {
      e.preventDefault();
      // dispatch(login({ username, password }))
      dispatch(login(formData))
        .then(data => {
          if (data.meta.requestStatus==='rejected') {
            // setLoginError(data.payload.detail);
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

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
    <>
      <NavbarComponent />
      <div className="center">
        <h4>
            Login
        </h4>
      </div>
      <div className="section container center">
        <div className="z-depth-3 green lighten-5 row login-position" >

          <form className="col s12" onSubmit={onSubmit}>
            <div className='row'>
              <div className='col s12'></div>
            </div>

            <div className='row'>
              <div className='input-field col s12'>
                <input className='validate' type='text' name='username' id='username' onChange={onChange}/>
                <label htmlFor='email'>Enter your username</label>
              </div>
            </div>

            <div className='row'>
              <div className='input-field col s12'>
                <input className='validate' type='password' name='password' id='password' onChange={onChange}/>
                <label htmlFor='password'>Enter your password</label>
              </div>
              <label className="label-forgot">
				<a className='pink-text' href='#!'><b>Forgot Password?</b></a>
			  </label>
            </div>
            <br/>
              <div className='row'>
                <button type='submit' className='col s12 btn btn-large waves-effect green'>Login</button>
              </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
