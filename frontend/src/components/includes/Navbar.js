import {
  useEffect,
  useRef,
  useState 
} from 'react';
import { NavLink,Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import M from 'materialize-css';
// import { AuthCheck } from "../includes/Auth";
// import { Logout } from '../Logout';
import { logout } from '../../features/user';
import './Navbar.css'

function NavbarComponent() {
  const ref = useRef(null);
  const side = useRef(null);
  const [formData,setFormData] = useState({
    username:'',
    email:'',
});
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
	const { isAuthenticated } = useSelector(state => state.user);

  useEffect(() => {
    const elem = ref.current;
    M.Dropdown.init(elem, 
        { 
          inDuration: 300, 
          outDuration: 225,
          coverTrigger:false
        });
    
    const sideElems = side.current;
    const options = {} // edge: 'right' };
    M.Sidenav.init(sideElems, options);

    if (isAuthenticated && user.user) {
      setFormData({
        username: user.user.username,
        email: user.user.email,
      });
    }
  }, [isAuthenticated, user]);
    
  // }, []);



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
          // onClick={Logout()}
          onClick={() => dispatch(logout())}
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

  const picture = user.user?.profile_picture ?? process.env.PUBLIC_URL + '/Default_pfp.svg';

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
    <div className="container-fluid">
      <Link className="navbar-brand" to="/">
        <img className="img-logo" src={process.env.PUBLIC_URL + "/Logo.png"} alt="Deep Forest Logo" />
      </Link>
      <ul id="dropdown1" className="dropdown-content">
        {isAuthenticated ? authlinks : guestLinks}
      </ul>
      <ul id="nav-mobile" className="right hide-on-med-and-down">
        <li className="nav-item"><NavLink className="nav-link" to="/request">New Request</NavLink></li>
        <li className="nav-item"><NavLink className="nav-link" to="/map">Samples</NavLink></li>
        <li className="nav-link nav-item"><a className="dropdown-trigger nav-link" href='#!'ref={ref} data-target="dropdown1"><img className="img-profile" src={picture} alt="User" /></a></li>
      </ul>


      <ul id="slide-out" className="sidenav" ref={side}>
      {isAuthenticated ? 
      <>
        <li>
          <div className="user-view">
            {/* <div className="background">
              <img src="images/office.jpg"/>
            </div> */}
              <a href="#user"><img className="circle" src={picture}/></a>
              <a href="#username"><span className="black-text name">{formData.username}</span></a> 
              <a href="#email"><span className="black-text email">{formData.email}</span></a> 
          </div>
        </li>

        <li><NavLink className="nav-link" to="/request">New Request</NavLink></li>
        <li><NavLink className="nav-link" to="/map">Samples</NavLink></li>
        <li><div className="divider"></div></li>
        {authlinks}
      </>
         : 
          <>
          <div className='container'>
            <h5 className='black-text'>
              Please, login or register to access features
            </h5>
          </div>
          
          {guestLinks}
          </>
         
         }
        {/* {isAuthenticated ? authlinks : guestLinks} */}
      </ul>
      <a href="#" data-target="slide-out" className="sidenav-trigger sidenav-style right">
        <i className="material-icons">menu</i>
      </a>


    </div>


  </nav>
  );
  };

export default NavbarComponent;