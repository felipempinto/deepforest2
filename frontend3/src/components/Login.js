import React, { 
    useEffect, 
    useState 
} from "react";
import NavbarComponent from "./includes/Navbar";
import M from 'materialize-css';
import axios from 'axios';
import './Login.css'
import { useCookies } from 'react-cookie';
import { AuthCheck } from "./includes/Auth";


const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/'

const Login = () => {
    const [formData,setFormData] = useState({
        username:'',
        password:'',
    });

    const [cookies, setCookie] = useCookies(['access_token', 'refresh_token'])
    // AuthCheck('/');

    const onSubmit = async (e) => {
        e.preventDefault()

        const response = await axios.post(`${API_URL}api/main/token/`,formData)
        .then((response) => {
            if (response.status === 200) {
                const { access, refresh } = response.data;
                // setCookie('access_token', access)
                // setCookie('refresh_token', refresh);

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
