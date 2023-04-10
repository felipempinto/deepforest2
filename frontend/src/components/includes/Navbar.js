import React, { 
  useRef, 
  useEffect, 
  useContext 
} from 'react';
import M from 'materialize-css';
import { ProductContext } from '../../ProductContext';

const Navbar = () => {
  const [products] = useContext(ProductContext);
  const dropdownRef = useRef(null);

  useEffect(() => {
    var dropdownElems = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdownElems, {
      coverTrigger: false,
      constrainWidth: false,
      alignment: 'right',
    });
  }, []);


  return (
    <nav>
      <div className="nav-wrapper blue-grey darken-3">
        <a href="/" className="brand-logo">
          Logo
        </a>

        <ul id="dropdown1" className="dropdown-content" ref={dropdownRef}>
          {products.map(product => (
            <li key={product.id}>
              <a href={product.url}>{product.name}</a>
            </li>
          ))}
        </ul>

        <ul id="nav-mobile" className="right hide-on-med-and-down">
          <li>
            <a className="dropdown-trigger" href="#!" data-target="dropdown1">
              Products
              <i className="material-icons right">arrow_drop_down</i>
            </a>
          </li>
          <li><a href='/login'>Login</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
