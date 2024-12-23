import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../features/user";
import { Navigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  Avatar,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const Register = () => {
  const dispatch = useDispatch();
  const { registered } = useSelector((state) => state.user);
  const [registerError, setRegisterError] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await dispatch(register(formData));
      if (data.meta.requestStatus === "rejected") {
        const errors = Object.values(data.payload).flat();
        setRegisterError(errors);
      } else {
        setRegisterError([]);
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  if (registered) return <Navigate to="/login" />;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f6f8",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{ padding: 4, backgroundColor: "white", textAlign: "center" }}
        >
          <Avatar sx={{ m: "auto", bgcolor: "green" }}>
            <PersonAddIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 2 }}>
            Register
          </Typography>
          {registerError.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {registerError.map((error, index) => (
                <Alert key={index} severity="error" sx={{ mb: 1 }}>
                  {error}
                </Alert>
              ))}
            </Box>
          )}
          <form onSubmit={onSubmit}>
            <TextField
              fullWidth
              margin="normal"
              id="username"
              label="Username"
              name="username"
              value={formData.username}
              onChange={onChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              id="email"
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              id="password"
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={onChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              id="password2"
              label="Confirm Password"
              name="password2"
              type="password"
              value={formData.password2}
              onChange={onChange}
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="success"
              sx={{ mt: 2 }}
            >
              Register
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
