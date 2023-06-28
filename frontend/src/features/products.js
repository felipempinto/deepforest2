import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const models = createAsyncThunk(
  'products/models',
  async (thunkAPI) => {
    try {
      const res = await fetch('/api/products/models/', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
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


export const getRequests = createAsyncThunk(
  'products/request/user',
  async (thunkAPI) => {
    try {
      const res = await fetch('/api/products/request/user/', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
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

export const deleteRequest = createAsyncThunk(
	'requests/delete',
	async (id, thunkAPI) => {
	  try {
		const res = await fetch(`/api/products/requests/delete/${id}`, {
		  method: 'DELETE',
		  headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		  },
		});
  
		if (res.ok) {
		  // Deletion was successful
      console.log('JOIA')
		  return id;
		} else {
		  const data = await res.json();
      console.log('SOCORRO2')
		  return thunkAPI.rejectWithValue(data);
		}
	  } catch (err) {
      console.log('SOCORRO')
		return thunkAPI.rejectWithValue(err.response.data);
	  }
	}
  );

export const request = createAsyncThunk(
  'products/request',
  async ({pth,bounds,date,userId},thunkAPI) => {

    // console.log(pth,bounds,date,);
    const body = JSON.stringify({
      'pth':pth,
      'date_requested':date,
      'bounds':bounds,
      'user':userId
  });

    try {
      const res = await fetch('/api/products/request/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
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


export const geojsondata = createAsyncThunk(
  'products/geojsondata',
  async (geojsonData,thunkAPI) => {
    try {
      const res = await fetch('/api/products/geojsondata/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
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
    models: [],
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