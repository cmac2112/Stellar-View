import React from 'react';
interface MaterialIconProps {
    name: string;
    color?: string;
}

//material icon to use google material icons https://fonts.google.com/icons
//example usage <MaterialIcon name="arrow_drop_down"/>



const MaterialIcon:React.FC<MaterialIconProps> = ({
    name,
    color
})=>{
    return(
    <span
        className="material-symbols-outlined button__material-icon dropdown-icon"
        aria-hidden="true"
        style={color ? { color } : {} }>
            {name}
        </span>
    );
}

export default MaterialIcon;