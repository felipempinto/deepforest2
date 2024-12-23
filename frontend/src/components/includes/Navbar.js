import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Menu, MenuItem, Drawer, List, ListItem, ListItemText, Box, Avatar, Typography, Divider, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useTheme } from '@mui/material/styles';
import { logout } from '../../features/user';
import './Navbar.css';

function NavbarComponent() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { isAuthenticated } = useSelector((state) => state.user);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const picture = user.user?.profile_picture ?? process.env.PUBLIC_URL + '/Default_pfp.svg';
  const [formData] = useState({
    username: user.user?.username || '',
    email: user.user?.email || '',
  });

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const links = (
    <>
      <ListItem button component={NavLink} to="/request">
        <ListItemText primary="New Request" />
      </ListItem>
      <ListItem button component={NavLink} to="/products">
        <ListItemText primary="Products" />
      </ListItem>
      <ListItem button component={NavLink} to="/map">
        <ListItemText primary="Samples" />
      </ListItem>
    </>
  );

  const authlinks = (
    <>
      <ListItem button component={NavLink} to="/requests">
        <ListItemText primary="My Requests" />
      </ListItem>
      <ListItem button component={NavLink} to="/dashboard">
        <ListItemText primary="Dashboard" />
      </ListItem>
      <ListItem button component={NavLink} to="/viewdata">
        <ListItemText primary="View Requests" />
      </ListItem>
      <ListItem button onClick={() => dispatch(logout())}>
        <ListItemText primary="Logout" />
      </ListItem>
    </>
  );

  const guestLinks = (
    <>
      <ListItem button component={NavLink} to="/login">
        <ListItemText primary="Login" />
      </ListItem>
      <ListItem button component={NavLink} to="/register">
        <ListItemText primary="Register" />
      </ListItem>
    </>
  );

  const sidenavHeader = (
    <Box sx={{ p: 2 }}>
      <Avatar src={picture} sx={{ width: 56, height: 56 }} />
      <Typography variant="h6">{formData.username}</Typography>
      <Typography variant="body2">{formData.email}</Typography>
      <Divider sx={{ mt: 1 }} />
    </Box>
  );

  return (
    <AppBar position="static" color="default">
      <Toolbar>
        <Link to="/" className="navbar-brand">
          <img
            className="img-logo"
            src={process.env.PUBLIC_URL + '/Logo.png'}
            alt="Deep Forest Logo"
            style={{ height: '40px' }}
          />
        </Link>
        <Box sx={{ flexGrow: 1 }} />
        {isSmallScreen ? (
          // Small Screens: Drawer with menu button
          <IconButton
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ ml: 2 }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {links}
            </Box>
            {isAuthenticated ? (
              <>
                <IconButton onClick={handleMenu} color="inherit">
                  <Avatar src={picture} />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={open}
                  onClose={handleClose}
                >
                  {authlinks}
                </Menu>
              </>
            ) : (
              guestLinks
            )}
          </>
        )}
      </Toolbar>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{ sx: { width: 250 } }}
      >
        {isAuthenticated ? (
          <>
            {sidenavHeader}
            <List>
              {links}
              <Divider />
              {authlinks}
            </List>
          </>
        ) : (
          <List>
            <Typography variant="h6" sx={{ p: 2 }}>
              Please login or register
            </Typography>
            {guestLinks}
          </List>
        )}
      </Drawer>
    </AppBar>
  );
}

export default NavbarComponent;
