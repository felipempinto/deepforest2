import {useEffect,useRef,useState } from 'react';
import { NavLink,Link } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
import M from 'materialize-css';
import { AuthCheck } from "../includes/Auth";
import { Logout } from '../Logout';
import './Navbar.css'

function NavbarComponent() {
  const ref = useRef(null);
  // const [isAuthenticated,setIsAuthenticated] = useState(false);


  const isAuthenticated = AuthCheck('')
  console.log(isAuthenticated);
  // useEffect(() => {
    // AuthCheck('')
    // setIsAuthenticated(AuthCheck(''));
    // async function checkAuthentication() {
    //   setIsAuthenticated(await AuthCheck(''));
    // }

    // checkAuthentication();
  // }, []); 

  useEffect(() => {
    const elem = ref.current;
    M.Dropdown.init(elem, 
        { 
          inDuration: 300, 
          outDuration: 225,
          coverTrigger:false
        });
  }, []);

  const authlinks = (
    <>
      <li className="nav-item">
        <NavLink className="nav-link" to="/requests">My requests</NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
      </li>
      <li className='nav-item'>
				<a 
          className='nav-link' 
          href='#!' 
          onClick={Logout()}
          // onClick={() => dispatch(logout())}
          >
					Logout
				</a>
			</li>
    </>
  );
  
  const guestLinks = (
    <>
      <li className="nav-item"><NavLink className="nav-link" to="/login">Login</NavLink></li>
      <li className="nav-item"><NavLink className="nav-link" to="/register">Register</NavLink></li>
    </>
  );

  // const picture = user.user?.profile_picture ?? '/Default_pfp.svg';
  const picture = 'Default_pfp.svg'


  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
    <div className="container-fluid">
      <Link className="navbar-brand" to="/">
        <img className="img-logo" src="/Logo.png" alt="Deep Forest Logo" />
      </Link>
      <ul id="dropdown1" class="dropdown-content">
        {isAuthenticated ? authlinks : guestLinks}
      </ul>
      <ul id="nav-mobile" className="right hide-on-med-and-down">
        <li className="nav-item"><NavLink className="nav-link" to="/request">New Request</NavLink></li>
        <li className="nav-item"><NavLink className="nav-link" to="/map">Samples</NavLink></li>
        
        <li className="nav-link nav-item"><a 
            className="dropdown-trigger nav-link" 
            href='#!'
            ref={ref} 
            data-target="dropdown1">
                <img className="img-profile" src={picture} alt="User" />
                
              
              {/* User */}
              {/* <i class="material-icons right">arrow_drop_down</i> */}
          </a>
        </li>
        {/* <li className="nav-item"><NavLink className="nav-link" to="/forestmask">Forest Mask</NavLink></li>
        <li className="nav-item"><NavLink className="nav-link" to="/landcover">Land Cover</NavLink></li> */}
        
      </ul>
    </div>
  </nav>
  );
  };

export default NavbarComponent;