import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ProductContext = createContext([]);

export const ProductProvider = (props) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/')
      .then(res => {
        setProducts(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  }, []);

  return (
    <ProductContext.Provider value={[products]}>
      {props.children}
    </ProductContext.Provider>
  );
};
