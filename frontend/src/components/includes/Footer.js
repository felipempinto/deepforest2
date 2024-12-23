import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

const Footer = () => {
  return (
    <Box component="footer" sx={{ backgroundColor: 'primary.dark', color: 'white', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Info
            </Typography>
            <Typography variant="body1">
              This is the deep forest website.
            </Typography>
            <Link href="/about" color="inherit" underline="hover">
              About
            </Link>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Doubts? Contact me:
            </Typography>
            <Box display="flex" gap={2}>
              <IconButton href="https://www.instagram.com/felipematheuspinto/" target="_blank" color="inherit">
                <InstagramIcon />
              </IconButton>
              <IconButton href="https://twitter.com/__felipemp__/" target="_blank" color="inherit">
                <TwitterIcon />
              </IconButton>
              <IconButton href="https://www.linkedin.com/in/felipe-matheus-pinto-70042b113" target="_blank" color="inherit">
                <LinkedInIcon />
              </IconButton>
              <IconButton href="https://github.com/felipempinto" target="_blank" color="inherit">
                <GitHubIcon />
              </IconButton>
              <IconButton href="mailto:felipempfreelancer@gmail.com?subject=Deep forest help" target="_blank" color="inherit">
                <EmailIcon />
              </IconButton>
              <IconButton href="https://www.upwork.com/freelancers/~01dac11ce87134abd6" target="_blank" color="inherit">
                <img
                  src={process.env.PUBLIC_URL + "/icons8-upwork-50.png"}
                  width="25"
                  height="25"
                  alt="Upwork"
                  style={{ display: 'inline-block' }}
                />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        <Box mt={4} textAlign="center">
          <Typography variant="body2">
            © 2023 Deep Forest
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
