// import { useEffect } from "react";
import M from "materialize-css";

//TODO: make it usefull, not using yet

export const Massage = (message,type)=>{
    
    const tooltips = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(tooltips);

    const color = {
        "error":'red rounded',
        "sucess":'green rounded',
        "warning":'blue rounded'
    }

    M.toast({
        html: message,
        classes: color[type],
        displayLength: 5000
      });

}