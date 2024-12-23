import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  login,
} from '../features/user';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Avatar,
  Paper,
  Alert,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await dispatch(login(formData));
      if (data.meta.requestStatus === "rejected") {
        const errorMessages = Object.values(data.payload).flat();
        setErrors(errorMessages);
      } else {
        setErrors([]);
        navigate("/request");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${process.env.PUBLIC_URL + '/IMG_1497.JPG'})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={3}
          sx={{ padding: 4, textAlign: "center", backgroundColor: "rgba(255, 255, 255, 0.85)" }}
        >
          <Avatar sx={{ m: "auto", bgcolor: "green" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 2 }}>
            Login
          </Typography>
          <form onSubmit={onSubmit}>
            <TextField
              fullWidth
              margin="normal"
              id="username"
              label="Username"
              name="username"
              onChange={onChange}
              autoComplete="username"
            />
            <TextField
              fullWidth
              margin="normal"
              id="password"
              label="Password"
              type="password"
              name="password"
              onChange={onChange}
              autoComplete="current-password"
            />
            <Box sx={{ textAlign: "right", mt: 1 }}>
              <Typography variant="body2">
                <a href="#!" style={{ color: "#d32f2f", textDecoration: "none" }}>
                  Forgot Password?
                </a>
              </Typography>
            </Box>
            {errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {errors.map((error, index) => (
                  <Alert key={index} severity="error" sx={{ mb: 1 }}>
                    {error}
                  </Alert>
                ))}
              </Box>
            )}
            <Button
              fullWidth
              variant="contained"
              color="success"
              type="submit"
              sx={{ mt: 3, mb: 2 }}
            >
              Login
            </Button>
          </form>
          <Box>
            <a href="/">
              <img
                src={process.env.PUBLIC_URL + "/Logo.png"}
                alt="Deep Forest Logo"
                style={{ height: 40, marginTop: 16 }}
              />
            </a>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
