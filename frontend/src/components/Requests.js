import React,{ useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import NavbarComponent from './includes/Navbar';
import { Navigate } from 'react-router-dom';
import M from 'materialize-css/dist/js/materialize.min.js';
import { getRequests } from '../features/products';
import { formatDistanceToNow } from 'date-fns';
// import M from 'materialize-css';

const Requests = () => {
    // React.useEffect(() => {
    //     M.AutoInit(); // Initialize Materialize components after rendering the table
    //   }, []);
    
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };
    const formatRelativeTime = (dateString) => {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
      };
    
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(getRequests());
      }, []); // Add an empty dependency array

      useEffect(()=>{
        const tooltips = document.querySelectorAll('.tooltipped');
        M.Tooltip.init(tooltips);
      })
    
    // const isAuthenticated = useSelector(state => state.user.isAuthenticated); 

    const requests = useSelector((state) => state.product.requests); 
    console.log(requests);

    // if (!isAuthenticated && !loading && user === null)
    //   return <Navigate to='/login'/>;

    // console.log("AUTH -> FORESMASK");
    // console.log(isAuthenticated);

    // if (!isAuthenticated) {
    //     return <Navigate to='/login'/>;
    //   }
      

    // {isAuthenticated ? authlinks : guestLinks}
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
            {/* <th>Request ID</th> */}
            {/* <th>Bounds</th> */}
            <th>Date Requested</th>
            {/* <th>Done</th>
            <th>Mask</th> */}
            <th className='center'>Download Mask<i className='material-icons tooltipped' data-position="bottom" data-tooltip={text}>help</i></th>
            {/* <th>Path</th> */}
            <th>Created At</th>
            <th>Updated At</th>
            {/* <th>User ID</th> */}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.name}</td>
              <td>{request.pth.product}</td>
              <td>{request.pth.version}</td>
              {/* <td>{request.id}</td> */}
              {/* <td>{request.bounds}</td> */}
              <td>{formatDate(request.date_requested)}</td>
              {/* <td>{request.done ? 'Yes' : 'No'}</td> */}
              {/* <td>{request.mask_url}</td>  */}
              <td>
                {
                request.done === false ? 
                (
                // <i className="fa fa-spinner fa-spin"></i> ):
                <div class="progress"><div class="indeterminate"></div></div> ): 
                (<div className='center'><a href={request.mask_url} download>Download {request.done}</a></div>)}
              </td>
              {/* <td>{request.pth}</td> */}
              <td>{formatRelativeTime(request.created_at)}</td>
              <td>{formatRelativeTime(request.updated_at)}</td>
              {/* <td>{request.user}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
    );
  }
  
  export default Requests;