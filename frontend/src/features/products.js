import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

export const train = createAsyncThunk(
  'train',
  async (_,thunkAPI) =>{
	try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/products/train/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      });
    
		const data = await res.json()
		
		if (res.status===200){
			return data
		} else {
			return thunkAPI.rejectWithValue(data);
		}
	} catch (err) {
		return thunkAPI.rejectWithValue(err.response.data);
	}
});

export const models = createAsyncThunk(
  'products/models',
  async (thunkAPI) => {
    try {
      // const res = await fetch('/api/products/models/', {
      //   method: 'GET',
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      // });
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/products/models/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
        });
      const data = await res.json();

      if (res.status === 200) {
        // console.log(res)
        return data;
      } else {
        return thunkAPI.rejectWithValue(data);
      }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);


export const modelsCsv = createAsyncThunk(
  'products/modelsCSV',
  async (thunkAPI) => {
    try {
      // const res = await fetch('/api/products/models/', {
      //   method: 'GET',
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      // });
      // const res = await fetch(`${process.env.REACT_APP_API_URL}/api/products/models/csv-data/`, {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/products/models-trained/`, {
        
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
        });
      const data = await res.json();

      if (res.status === 200) {
        // console.log(res)
        return data;
      } else {
        return thunkAPI.rejectWithValue(data);
      }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);


export const getRequests = createAsyncThunk(
  'products/request/user',
  async (thunkAPI) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/products/requests/user/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
        });
      const data = await res.json();

      if (res.status === 200) {
        return data;
      } else {
        return thunkAPI.rejectWithValue(data);
      }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);

export const deleteRequest = createAsyncThunk(
	'requests/delete',
	async (id, thunkAPI) => {
	  try {
		const res = await fetch(`${process.env.REACT_APP_API_URL}/api/products/requests/delete/${id}`, {
		  method: 'DELETE',
		  headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		  },
		});
  
		if (res.ok) {
		  return id;
		} else {
		  const data = await res.json();
		  return thunkAPI.rejectWithValue(data);
		}
	  } catch (err) {
		return thunkAPI.rejectWithValue(err.response.data);
	  }
	}
  );

export const request = createAsyncThunk(
  'products/request',
  async ({pth,bounds,date,userId},thunkAPI) => {

    const body = JSON.stringify({
      'pth':pth,
      'date_requested':date,
      'bounds':bounds,
      'user':userId
  });

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/products/requests/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get("access_token")}`,
          'Content-Type': 'application/json',
        },
        body,
        });
      // const res = await fetch('/api/products/request/', {
      //   method: 'POST',
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      //   body,
      // });
      const data = await res.json();

      if (res.status === 200) {
        console.log(res)
        return data;
      } else {
        return thunkAPI.rejectWithValue(data);
      }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);


export const geojsondata = createAsyncThunk(
  'products/geojsondata',
  async (geojsonData,thunkAPI) => {
    try {
      // const res = await fetch('/api/products/geojsondata/', {
      //   method: 'POST',
      //   headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(geojsonData),
      // });
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/products/geojsondata/`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json',
        },
            // body,
            body: JSON.stringify(geojsonData),
        });

      const data = await res.json();

      if (res.status === 200) {
        console.log(res)
        return data;
      } else {
        return thunkAPI.rejectWithValue(data);
      }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data);
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState: {
    train: [],
    models: [],
    modelsCSV: [],
    geojsondata:[],
    requests:[],
    loading: false,
    error: null,
  },
  reducers: {
    getProduct: (state, action) => {
        state.models = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(models.pending, (state) => {
        state.loading = true;
      })
      .addCase(models.fulfilled, (state, action) => {
        state.models = action.payload;
        state.loading = false;
      })
      .addCase(models.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(modelsCsv.pending, (state) => {
        state.loading = true;
      })
      .addCase(modelsCsv.fulfilled, (state, action) => {
        state.modelsCSV = action.payload;
        state.loading = false;
      })
      .addCase(modelsCsv.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(train.pending, (state) => {
        state.loading = true;
      })
      .addCase(train.fulfilled, (state, action) => {
        state.train = action.payload;
        state.loading = false;
      })
      .addCase(train.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(geojsondata.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(geojsondata.fulfilled, (state, action) => {
        state.geojsondata = action.payload;
        state.loading = false;
      })
      .addCase(geojsondata.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(request.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(request.fulfilled, (state, action) => {
        // state.geojsondata = action.payload;
        state.loading = false;
      })
      .addCase(request.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      })
      .addCase(getRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRequests.fulfilled, (state, action) => {
        state.requests = action.payload;
        state.loading = false;
      })
      .addCase(getRequests.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  },
});

export const { getProduct } = productSlice.actions;
export default productSlice.reducer;