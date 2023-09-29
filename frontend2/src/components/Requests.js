import React,{ useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import NavbarComponent from './includes/Navbar';
import { 
  Navigate,
  Link
} from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize.min.js';
import { getRequests,deleteRequest } from '../features/products';
import { formatDistanceToNow } from 'date-fns';
// import M from 'materialize-css';

const Requests = () => {
    const { isAuthenticated, user, loading } = useSelector(state => state.user);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };
    const formatRelativeTime = (dateString) => {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
      };

    const handleDeleteRequest = (requestId) => {
        dispatch(deleteRequest(requestId))
          .then((action) => {
            
            if (action.meta.requestStatus === 'fulfilled') {
              window.location.reload();
            } else {
              console.error('Failed to delete request');
            }
          })
          .catch((error) => {
            console.log("C");
            console.error('Error occurred while deleting request:', error);
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
    
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(getRequests());
      }, [dispatch]); 

    useEffect(()=>{
        const tooltips = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(tooltips);
      })
    
    const requests = useSelector(state => state.product.requests); 

    if (!isAuthenticated && !loading && user === null)
      return <Navigate to='/login'/>;

    const text = 'The processing usually takes from 30 minutes to 1h'
    return (
    <>
      <NavbarComponent/>
      <div className='container'>
        <h1 className='center'>Your requests</h1>
        <table className="highlight">
        <thead>
          <tr>
            <th>Name</th>
            <th>Product</th>
            <th>Version</th>
            <th>Date Requested</th>
            <th className='center'>Download Mask<i className='material-icons tooltipped' data-position="bottom" data-tooltip={text}>help</i></th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.name}</td>
              <td>{request.pth.product}</td>
              <td>{request.pth.version}</td>
              <td>{formatDate(request.date_requested)}</td>
              <td>
                {
                request.done === false ? 
                (
                <div className="progress"><div className="indeterminate"></div></div> ): 
                (
                <div className='center'>
                    <Link to={request.mask_url} target='_blank' onClick={() => handleDownload(request.mask_url)}>
                      Download {request.done}
                    </Link>
                </div>
                )}
              </td>
              <td>{formatRelativeTime(request.created_at)}</td>
              <td>{formatRelativeTime(request.updated_at)}</td>
              <td>
                <a href="/#" onClick={() => handleDeleteRequest(request.id)}>
                  <i className='material-icons'>delete</i>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
    );
  }
  
  export default Requests;