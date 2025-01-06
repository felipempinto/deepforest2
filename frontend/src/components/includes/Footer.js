import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        // background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
        background: 'linear-gradient(135deg,rgb(85, 85, 85),rgb(216, 216, 216))',
        color: 'white',
        py: 6,
        boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Info Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Info
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This is the Deep Forest website.
            </Typography>
            <Link href="/about" color="inherit" underline="hover">
              About
            </Link>
          </Grid>

          {/* Contact Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Questions? Contact me:
            </Typography>
            <Box display="flex" gap={2}>
              {/* <IconButton href="https://www.instagram.com/felipematheuspinto/" target="_blank" sx={{ color: 'black' }}>
                <InstagramIcon />
              </IconButton> */}
              <IconButton href="https://twitter.com/__felipemp__/" target="_blank" sx={{ color: 'black' }}>
                <TwitterIcon />
              </IconButton>
              <IconButton
                href="https://www.linkedin.com/in/felipe-matheus-pinto-70042b113"
                target="_blank"
                sx={{ color: 'black' }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton href="https://github.com/felipempinto" target="_blank" sx={{ color: 'black' }}>
                <GitHubIcon />
              </IconButton>
              <IconButton
                href="mailto:felipempfreelancer@gmail.com?subject=Deep forest help"
                target="_blank"
                sx={{ color: 'black' }}
              >
                <EmailIcon />
              </IconButton>
              <IconButton href="https://www.upwork.com/freelancers/~01dac11ce87134abd6" target="_blank" sx={{ color: 'black' }}>
                <img
                  src={process.env.PUBLIC_URL + '/icons8-upwork-50.png'}
                  width="25"
                  height="25"
                  alt="Upwork"
                  style={{ display: 'inline-block' }}
                />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Footer Bottom Section */}
        <Box mt={4} textAlign="center">
          <Typography variant="body2">
            © {new Date().getFullYear()} Deep Forest. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
