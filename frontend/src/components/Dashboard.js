import React from 'react';
import Navbar from './includes/Navbar';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function Dashboard() {
    const { isAuthenticated, user, loading } = useSelector(state => state.user);

    if (!isAuthenticated && !loading && user === null)
      return <Navigate to='/login'/>;
    
    return (
      <>
        <Navbar/>
        {loading || user === null ? (
				<div className='spinner-border text-primary' role='status'>
					<span className='visually-hidden'>Loading...</span>
				</div>
			) : (
				<>
					<h1 className='mb-5'>Dashboard</h1>
					<p>User Details</p>
					<ul>
						<li>Username: {user.username}</li>
						<li>Email: {user.email}</li>
					</ul>
				</>
			)}
      </>
    )
  // return (
  //   <div>
  //     <Navbar />
  //     <h1>Welcome to the Dashboard Page</h1>
  //   </div>
  // );
}

export default Dashboard;
