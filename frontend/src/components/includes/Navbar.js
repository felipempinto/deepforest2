import React, { useState} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Menu, 
  MenuItem, 
  Box, 
  Avatar, 
  Typography, 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { logout } from '../../features/user';
import './Navbar.css';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { isAuthenticated } = useSelector((state) => state.user);
  const navigate = useNavigate()
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  const picture = user.user?.profile_picture ?? process.env.PUBLIC_URL + '/Default_pfp.svg';

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const links = <>
    <Button
      onClick={()=>navigate("/products")}
      sx={{ my: 2, color: 'black', display: 'block' }}
      sx={{ my: 2, color: 'black', display: 'block' }}
    >
      Products
    </Button>
    <Button
      onClick={()=>navigate("/map")}
      sx={{ my: 2, color: 'black', display: 'block' }}
    >
      Samples
    </Button>
  </>

  const links2 = <>
    <MenuItem onClick={()=>navigate("/products")}>
      <Typography sx={{ textAlign: 'center',color:'black' }}>
        Products
      </Typography>
    </MenuItem>
    <MenuItem onClick={()=>navigate("/map")}>
      <Typography sx={{ textAlign: 'center' }}>
        Samples
      </Typography>
    </MenuItem>
  </>

  const authlinks = <>
  <MenuItem onClick={()=>navigate("/request")}>
      <Typography sx={{ textAlign: 'center' }}>New Request</Typography>
    </MenuItem>
    <MenuItem onClick={()=>navigate("/requests")}>
      <Typography sx={{ textAlign: 'center' }}>My requests</Typography>
    </MenuItem>
    <MenuItem onClick={()=>navigate("/viewdata")}>
      <Typography sx={{ textAlign: 'center' }}>View Requests</Typography>
    </MenuItem>
    <MenuItem onClick={()=>navigate("/dashboard")}>
      <Typography sx={{ textAlign: 'center' }}>Profile</Typography>
    </MenuItem>
    <MenuItem onClick={() => dispatch(logout())}>
      <Typography sx={{ textAlign: 'center' }}>Logout</Typography>
    </MenuItem>
    </>

  const guestLinks = <>
    <MenuItem onClick={()=>navigate("/login")}>
      <Typography sx={{ textAlign: 'center' }}>Login</Typography>
    </MenuItem>
    <MenuItem onClick={()=>navigate("/register")}>
      <Typography sx={{ textAlign: 'center' }}>Register</Typography>
    </MenuItem>
  </>

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Button sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}>
            <Link to="/">
              <img
                src={process.env.PUBLIC_URL + '/Logo.png'}
                alt="Deep Forest Logo"
                style={{ height: '40px' }}
              />
            </Link>
          </Button>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {links2}
            </Menu>
          </Box>
          <Button
            sx={{
              mr: 8,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 2,
            }}
            >
            <Link to="/">
              <img
                src={process.env.PUBLIC_URL + '/Logo.png'}
                alt="Deep Forest Logo"
                style={{ height: '40px' }}
              />
            </Link>
          </Button>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {links}
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar 
                  alt={user.username} 
                  src={picture}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {isAuthenticated?authlinks:guestLinks}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;

