import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const homepage = createAsyncThunk(
  'home',
  async (_,thunkAPI) =>{
	try {
		const res = await fetch('/api/products',{
			method:'GET',
			headers:{
				Accept:'application/json',
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

export const tiles = createAsyncThunk(
  'tiles',
  async ({ product, date1, date2 }, thunkAPI) => {
    const body = JSON.stringify({
      product,
      date1,
      date2,
    });

    try {
      const res = await fetch('/api/tiles', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
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

const mainSlice = createSlice({
  name: 'main',
  initialState: {
    products: [],
    tiles: [],
  },
  reducers: {
    addProduct: (state, action) => {
      state.products.push(action.payload);
    },
    addTiles: (state, action) => {
      state.tiles = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(homepage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(homepage.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(homepage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(tiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(tiles.fulfilled, (state, action) => {
        state.loading = false;
        state.tiles = action.payload;
      })
      .addCase(tiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addProduct, addTiles } = mainSlice.actions;
export default mainSlice.reducer;