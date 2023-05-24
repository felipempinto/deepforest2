import React from 'react';
import NavbarComponent from './includes/Navbar';
import { useSelector } from 'react-redux';
import { Navigate,useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { deleteUser } from '../features/user';

function Dashboard() {
    const { isAuthenticated, user, loading } = useSelector(state => state.user);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleDeleteUser = () => {
      dispatch(deleteUser(user.id))
      .unwrap()
      .then(() => {
        // Deletion was successful, handle any necessary actions
        console.log('User deleted successfully');
      })
      .catch((error) => {
        // Error occurred during deletion, handle the error
        console.error('Error deleting user:', error);
      });
    };

    if (!isAuthenticated && !loading && user === null)
      return <Navigate to='/login'/>;

      return (
        <>
          <NavbarComponent />
          {loading || user === null ? (
            <div className='spinner-border text-primary' role='status'>
              <span className='visually-hidden'>Loading...</span>
            </div>
          ) : (
            <div className='container'>
              <h1 className='mb-5 center'>Dashboard</h1>
              <div className='card'>
                <div className='card-body'>
                  <h5 className='card-title center'>User Details</h5>
                  <div className='row'>
                    <div className='col-12'>Profile Picture:</div>
                    <div className='col'>
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt='Profile'
                          width='100'
                          height='100'
                        />
                      ) : (
                        'No picture uploaded'
                      )}
                    </div>
                  </div>
                  <div className='row'>
                    <div className='col-2'>Username:</div>
                    <div className='col'>{user.username}</div>
                  </div>
                  <div className='row'>
                    <div className='col-2'>Email:</div>
                    <div className='col'>{user.email}</div>
                  </div>
                  <div className='row'>
                    <div className='col-2'>First Name:</div>
                    <div className='col'>{user.first_name}</div>
                  </div>
                  <div className='row'>
                    <div className='col-2'>Last Name:</div>
                    <div className='col'>{user.last_name}</div>
                  </div>
                </div>
              </div>
              <div>
                <button className='btn btn-primary mt-3' onClick={() => navigate('/update')}>
                  Update Profile
                </button>
              </div>
              <div>
                <button className='btn btn-primary mt-3' onClick={handleDeleteUser}>Delete User</button>
              </div>
            </div>
          )}
        </>
      );
    }
    
//     return (
//       <>
//         <NavbarComponent/>
//         {loading || user === null ? (
// 				<div className='spinner-border text-primary' role='status'>
// 					<span className='visually-hidden'>Loading...</span>
// 				</div>
// 			) : (
// 				<>
// 					<h1 className='mb-5'>Dashboard</h1>
// 					<p>User Details</p>
// 					<ul>
// 						<li>Username: {user.username}</li>
// 						<li>Email: {user.email}</li>
// 					</ul>
// 				</>
// 			)}
//       </>
//     )
//   // return (
//   //   <div>
//   //     <Navbar />
//   //     <h1>Welcome to the Dashboard Page</h1>
//   //   </div>
//   // );
// }

export default Dashboard;
