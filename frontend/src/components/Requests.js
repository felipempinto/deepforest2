import React,{ useEffect,useState } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import NavbarComponent from './includes/Navbar';
import { 
  Navigate,
  Link
} from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize.min.js';
import { getRequests,deleteRequest } from '../features/products';
import { formatDistanceToNow } from 'date-fns';
import {loadingPage} from './Loading'
// import M from 'materialize-css';


// const formatDate = (dateString) => {
    //     const options = { year: 'numeric', month: 'long', day: 'numeric' };
    //     return new Date(dateString).toLocaleDateString(undefined, options);
    // };

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
    const { isAuthenticated, user, loading } = useSelector(state => state.user);
    const [requests, setRequests] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
      dispatch(getRequests()).then(action => {
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
              setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
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
    
    
    useEffect(() => {
        dispatch(getRequests());
      }, [dispatch]); 

    useEffect(()=>{
        const tooltips = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(tooltips);
      })
    
    if (!isAuthenticated && !loading && user === null){
      return <Navigate to='/login'/>;
    }

    const statusButton = (request)=>{

      const status = request.status

      if (status=="PROCESSING") {
        return <div className="progress"><div className="indeterminate"></div></div> 
      } else if (status=="DONE") {
        return <>
        <div className='center'>
            <Link to={request.mask_url} target='_blank' onClick={() => handleDownload(request.mask_url)}>
              <i className='material-icons'>download</i> {request.done}
            </Link>
        </div>
        </>
      } else if (status=="ERROR") {
        return <div className='tooltipped' data-position="bottom" data-tooltip="There was an error with your processing!"> 
                <i className="material-icons">error</i>
               </div> 
      } 
    }


    const text = 'The processing usually takes from 30 minutes to 1h'
    return (
    <>
      <NavbarComponent/>
      <div className='container'>
        <h1 className='center'>Your requests</h1>
        {isDeleting ? loadingPage("Deleting...") : (
        <table className="highlight">
        <thead>
          <tr>
            {/* <th>Name</th> */}
            <th>Requested bounds</th>
            <th>Name</th>
            <th>Product</th>
            <th>Version</th>
            {/* <th>Date Requested</th> */}
            <th className='center'>Download Mask
              <i  
                className='material-icons tooltipped' 
                data-position="bottom" 
                data-tooltip={text}>
                  help
              </i>
            </th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              {/* <td>{request.name}</td> */}
              <td>
              <a
                className='btn btn-small green' 
                onClick={
                () => exportGeoJSONAsFile(
                    request.geojson,
                    `${request.name}_bounds.geojson`)
                    }>
                Export GeoJSON
              </a>
              </td>
              <td>{request.name}</td>
              <td>
                {/* {test(request)} */}
                {request.pth.product}
              </td>
              <td>{request.pth.version}</td>
              {/* <td>{formatDate(request.date_requested)}</td> */}
              <td>{statusButton(request)}</td>
              <td>{formatRelativeTime(request.created_at)}</td>
              <td>{formatRelativeTime(request.updated_at)}</td>
              <td>
                {request.id}
                <a href="#" onClick={() => handleDeleteRequest(request.id)}>
                  <i className='material-icons black-text'>delete</i>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      </div>
    </>
    );
  }
  
  export default Requests;