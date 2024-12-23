import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { deleteUser, logout } from "../features/user";
import NavbarComponent from "./includes/Navbar";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

function Dashboard() {
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { isAuthenticated, user, loading } = useSelector((state) => state.user);

  const handleDeleteUser = () => {
    dispatch(deleteUser(user.id))
      .unwrap()
      .then(() => {
        console.log("User deleted successfully");
        dispatch(logout());
      })
      .catch((error) => {
        console.error("Error deleting user:", error);
      });
  };

  if (!isAuthenticated && !loading && user === null) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <NavbarComponent />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: loading || user === null ? "center" : "start",
          backgroundColor: "#f4f6f8",
          padding: 4,
        }}
      >
        {loading || user === null ? (
          <CircularProgress />
        ) : (
          <Box sx={{ maxWidth: 600, width: "100%" }}>
            <Typography variant="h4" component="h1" textAlign="center" mb={4}>
              Dashboard
            </Typography>
            <Card>
              <CardContent>
                <Typography variant="h5" textAlign="center" gutterBottom>
                  User Details
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={4}>
                    <Typography variant="body1" fontWeight="bold">
                      Username:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">{user.username}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" fontWeight="bold">
                      Email:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">{user.email}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" fontWeight="bold">
                      Requests:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">{user.request}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Box sx={{ mt: 4, textAlign: "center" }}>
              <Button
                variant="contained"
                color="error"
                onClick={() => setConfirmDelete(true)}
              >
                Delete User
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? All your requests will be
            lost forever.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} color="primary">
            No
          </Button>
          <Button onClick={handleDeleteUser} color="error">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Dashboard;
