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

const productSlice = createSlice({
  name: 'product',
  initialState: {
    models: [],
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
  },
});

export const { getProduct } = productSlice.actions;
export default productSlice.reducer;