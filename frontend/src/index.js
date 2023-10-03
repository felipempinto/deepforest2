import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './index.css';
import 'leaflet/dist/leaflet.css';

import { store } from './store';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   // <React.StrictMode>
//   // </React.StrictMode> 
//   <React>
//     <Provider store={store}>
//       <App />
//     </Provider>
//   </React>
// );

ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
  document.getElementById('root')
);

reportWebVitals();
