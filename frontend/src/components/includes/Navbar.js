import {useEffect,useRef} from 'react';
import { NavLink,Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/user';
import M from 'materialize-css';
import './Navbar.css'

function NavbarComponent() {
  const ref = useRef(null);
  const dispatch = useDispatch();
	const { isAuthenticated } = useSelector(state => state.user);

  useEffect(() => {
    const elem = ref.current;
    M.Dropdown.init(elem, 
        { 
          inDuration: 300, 
          outDuration: 225,
          coverTrigger:false
        });
  }, []);


  // const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const authlinks = (
    <>
      <li className="nav-item">
        <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
      </li>
      <li className='nav-item'>
				<a className='nav-link' href='#!' onClick={() => dispatch(logout())}>
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
        <li className="nav-item"><NavLink className="nav-link" to="/request">Request</NavLink></li>
        <li className="nav-item"><NavLink className="nav-link" to="/map">Samples</NavLink></li>
        
        <li className="nav-link nav-item"><a 
            className="dropdown-trigger nav-link" 
            href='#!'
            ref={ref} 
            data-target="dropdown1">
              User
              <i class="material-icons right">arrow_drop_down</i>
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