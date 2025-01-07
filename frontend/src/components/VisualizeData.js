import React, { 
  useEffect
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { visualization } from '../features/products.js';
import MapComponent from './MapComponent.js'
import './RequestMap.css';
import './VisualizeData.css'

const VisualizeMap = () => {
  const dispatch = useDispatch();
  const { visualization: visualData, loading, error } = useSelector(
    state => state.product);

  useEffect(() => {
      dispatch(visualization());
  }, [dispatch]);

  console.log(visualData)

  return (
      <>
          {loading && <p>Loading...</p>}
          {error && <p>Error: {error}</p>}
          <MapComponent
              userRequests={visualData}
          />
      </>
  );
}

export default VisualizeMap;
