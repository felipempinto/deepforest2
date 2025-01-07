import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NavbarComponent from './includes/Navbar';
import { Navigate } from 'react-router-dom';
import { getRequests, deleteRequest } from '../features/products';
import { formatDistanceToNow } from 'date-fns';
import {
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  IconButton,
  Button,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

function exportGeoJSONAsFile(geoJSONText, fileName) {
  const blob = new Blob([geoJSONText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const Requests = () => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.user);
  const [requests, setRequests] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getRequests()).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        setRequests(action.payload);
      }
    });
  }, [dispatch]);

  const formatRelativeTime = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleDeleteRequest = (requestId) => {
    setIsDeleting(true);
    dispatch(deleteRequest(requestId))
      .then((action) => {
        if (action.meta.requestStatus === 'fulfilled') {
          setRequests((prevRequests) =>
            prevRequests.filter((request) => request.id !== requestId)
          );
        } else {
          console.error('Failed to delete request');
        }
        setIsDeleting(false);
      })
      .catch((error) => {
        console.error('Error occurred while deleting request:', error);
        setIsDeleting(false);
      });
  };

  const handleDownload = (maskUrl) => {
    const link = document.createElement('a');
    link.href = maskUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated && !loading && user === null) {
    return <Navigate to="/login" />;
  }

  const statusButton = (request) => {
    const status = request.status;

    if (status === 'PROCESSING') {
      return <CircularProgress size={24} />;
    } else if (status === 'DONE') {
      return (
        <Tooltip title="Download">
          <IconButton
            color="primary"
            onClick={() => handleDownload(request.mask_url)}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      );
    } else if (status === 'ERROR') {
      return (
        <Tooltip title="There was an error with your processing!">
          <ErrorIcon color="error" />
        </Tooltip>
      );
    }
  };

  const text = 'The processing usually takes from 30 minutes to 1h';
  return (
    <>
      <NavbarComponent />
      <div className="container">
        <h1 style={{ textAlign: 'center' }}>Your requests</h1>
        {isDeleting ? (
          <div style={{ textAlign: 'center', margin: '20px' }}>
            <CircularProgress />
            <p>Deleting...</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requested bounds</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Version</TableCell>
                <TableCell align="center">
                  Download Mask
                  <Tooltip title={text}>
                    <HelpOutlineIcon fontSize="small" style={{ marginLeft: 8 }} />
                  </Tooltip>
                </TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      href="#"
                      onClick={() =>
                        exportGeoJSONAsFile(
                          request.geojson,
                          `${request.name}_bounds.geojson`
                        )
                      }
                    >
                      Export GeoJSON
                    </Button>
                  </TableCell>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>{request.pth.product}</TableCell>
                  <TableCell>{request.pth.version}</TableCell>
                  <TableCell align="center">{statusButton(request)}</TableCell>
                  <TableCell>{formatRelativeTime(request.created_at)}</TableCell>
                  <TableCell>{formatRelativeTime(request.updated_at)}</TableCell>
                  <TableCell>
                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
};

export default Requests;
