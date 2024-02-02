import React, { 
    // useEffect, 
    useState 
} from "react";
// import { Navigate} from 'react-router-dom';
import { useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
    
    const onSubmit = e => {
      e.preventDefault();
      dispatch(login(formData))
        .then(data => {
          if (data.meta.requestStatus==='rejected') {
            const errors = Object.values(data.payload).flat();
            errors.forEach(error => {
              M.toast({
                html: error,
                classes: 'red rounded',
                displayLength: 10000
              });
            })
          } else {
            M.toast(
              {html: "Login sucessful", 
               classes: 'green rounded',
               displayLength:5000});
            // return <Navigate to='/request'/>;
            navigate("/request");
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
      
      <div className="background-image" style={{ 
          backgroundImage: `url(${process.env.PUBLIC_URL + '/IMG_1497.JPG'})` 
        }}>
        <div className="section container center">
          <div className="z-depth-3 green lighten-5 row login-position" >
            <a href="/"><img src={process.env.PUBLIC_URL + "/Logo.png"} alt="Deep Forest Logo" /></a>
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
                  <button 
                    type='submit' 
                    className='col s12 btn btn-large waves-effect green login-button'>
                      Login
                  </button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
