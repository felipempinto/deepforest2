import React, { 
  useState, 
  // useEffect 
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { update } from "../features/user";
import NavbarComponent from './includes/Navbar';

import './UpdateProfile.css';

const UpdateProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const [first_name, setFirstName] = useState(user.first_name);
  const [last_name, setLastName] = useState(user.last_name);
  const [profile_picture, setProfilePicture] = useState(null);


  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   dispatch(
  //       update({first_name, last_name, profile_picture})
  //     )};

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('first_name', first_name);
    formData.append('last_name', last_name);
    formData.append('profile_picture', profile_picture);
    console.log(formData)
    dispatch(
      update(formData)
    );
  };  

  return (
    <>
      <NavbarComponent />
      <div className="container">
        <h2 className="form-heading">Update Profile</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="first_name" className="form-label">First Name:</label>
            <input
              type="text"
              name="first_name"
              className="form-input"
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="last_name" className="form-label">Last Name:</label>
            <input
              type="text"
              name="last_name"
              className="form-input"
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="profile_picture" className="form-label">Profile Picture:</label>
            <input
              type="file"
              name="profile_picture"
              className="form-input"
              onChange={(e) => setProfilePicture(e.target.files[0])}
            />
          </div>
          <button type="submit" className="submit-btn">Update</button>
        </form>
      </div>
    </>
  );
};

export default UpdateProfile;