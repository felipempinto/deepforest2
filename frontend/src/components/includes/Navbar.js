import React from 'react';
import { NavLink,Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/user';
import './Navbar.css'

function NavbarComponent() {

  const dispatch = useDispatch();
	const { isAuthenticated } = useSelector(state => state.user);

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
      <ul id="nav-mobile" className="right hide-on-med-and-down">
        {isAuthenticated ? authlinks : guestLinks}
        <li className="nav-item"><NavLink className="nav-link" to="/forestmask">Forest Mask</NavLink></li>
        <li className="nav-item"><NavLink className="nav-link" to="/landcover">Land Cover</NavLink></li>
        <li className="nav-item"><NavLink className="nav-link" to="/map">Samples</NavLink></li>
      </ul>
    </div>
  </nav>
  );
  };

export default NavbarComponent;