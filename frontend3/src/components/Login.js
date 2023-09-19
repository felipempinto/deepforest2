import React, { 
    useEffect, 
    useState 
} from "react";
// import { useDispatch,useSelector } from "react-redux";
// import { Navigate } from 'react-router-dom'
// import {resetRegistered,login} from '../features/user';
import NavbarComponent from "./includes/Navbar";
import M from 'materialize-css';
import axios from 'axios';
import './Login.css'
const cookie = require('cookie');

const API_URL = process.env.API_URL || 'http://127.0.0.1:8000/'

// function checkAuth(access,refresh){
//     // const response = await axios.post(`${API_URL}api/main/token/`,formData)
//     return true
// }

const Login = () => {
    const [formData,setFormData] = useState({
        username:'',
        password:'',
    });

    const [accessToken,setAccessToken] = useState(localStorage.getItem('access_token'))
    const [refreshToken,setRefreshToken] = useState(localStorage.getItem('refresh_token'))

    useEffect(() => {
        // setAccessToken(localStorage.getItem('access_token'))
        // setRefreshToken(localStorage.getItem('refresh_token'))
        console.log("CHANGING TOKENS");
        console.log(accessToken,refreshToken)
        console.log(
                    localStorage.getItem('access_token'),
                    localStorage.getItem('refresh_token')
                    )
        console.log("AAAAAAAAAAAAAA333333333333333333")
      }, [])
    

    const onSubmit = async (e) => {
        e.preventDefault()

        const response = await axios.post(`${API_URL}api/main/token/`,formData)
        .then((response) => {
            if (response.status === 200) {
                console.log("SUCESS")
                const { access, refresh } = response.data;
                console.log(access,refresh);
                console.log("SUCCESS 2")
                cookie.serialize('access', access, {
                    httpOnly: true,
                    maxAge: 60 * 30,
                    path: '/api/',
                    sameSite: 'strict',
                    secure: process.env.NODE_ENV === 'production',
                })
                cookie.serialize('refresh', refresh, {
                    httpOnly: true,
                    maxAge: 60 * 60 * 24,
                    path: '/api/',
                    sameSite: 'strict',
                    secure: process.env.NODE_ENV === 'production',
                })
                
                setAccessToken(access)
                setRefreshToken(refresh);

            } else {
                console.log(response.status)
            }
        })
        .catch((error) => {
            M.toast({html: error})
        })
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
                <label for='email'>Enter your username</label>
              </div>
            </div>

            <div className='row'>
              <div className='input-field col s12'>
                <input className='validate' type='password' name='password' id='password' onChange={onChange}/>
                <label for='password'>Enter your password</label>
              </div>
              <label className="label-forgot">
				<a className='pink-text' href='#!'><b>Forgot Password?</b></a>
			  </label>
            </div>

            <br />
              <div className='row'>
                <button type='submit' className='col s12 btn btn-large waves-effect green'>Login</button>
                {/* <button type="submit" className="btn btn-primary">Login</button> */}
              </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
