import './Loading.css'; 


export const loadingPage = (message="Loading...")=>{
    return(
    <div className="loading-container">
        <div className="spinner"></div>
            <p>{message}</p>
    </div>
    )
} 
    