// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// export const imagelocations = createAsyncThunk(
//   'forestmask/imagelocations',
//   async (_,thunkAPI) =>{
// 	try {
// 		const res = await fetch('/api/forestmask/images-location',{
// 			method:'GET',
// 			headers:{
// 				Accept:'application/json',
// 			},
// 		});
    
// 		const data = await res.json()
		
// 		if (res.status===200){
// 			return data
// 		} else {
// 			return thunkAPI.rejectWithValue(data);
// 		}
// 	} catch (err) {
//     console.log(err)
// 		return thunkAPI.rejectWithValue(err.response.data);
// 	}
// });

// const forestmaskSlice = createSlice({
//   name: 'forestmask',
//   initialState: {
//     products: [],
//   },
//   reducers: {
//     addForestmask: (state, action) => {
//       state.products.push(action.payload);
//     },
//   },
//   extraReducers: (builder) =>{
//     builder
//         .addCase(imagelocations.pending,(state)=>{
//             state.loading=true;
//             state.error=null;
//         })
//         .addCase(imagelocations.fulfilled,(state,action)=>{
//             state.loading=false;
//             state.products=action.payload;
//         })
//         .addCase(imagelocations.rejected,(state,action)=>{
//             state.loading=false;
//             state.error=action.payload;
//         });
//   },
// });

// export const { addForestmask } = forestmaskSlice.actions;
// export default forestmaskSlice.reducer;