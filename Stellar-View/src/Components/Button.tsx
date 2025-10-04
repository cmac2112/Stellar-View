import React from 'react'
import MaterialIcon from "./MaterialIcon.tsx";

interface ButtonProps {
    label: string;
    OnClickCallback: () => void;
    disabled?: boolean;
    className?: string;
    variant?: string;
    materialIconName?: string;
    iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
                                           label,
                                           OnClickCallback,
                                           disabled = false,
                                           className = '',
                                           materialIconName,
                                           iconPosition = 'left'
                                       }) => {
    const baseClasses = `
        button-component
        relative flex items-center justify-between text-center
        font-medium transition-all duration-300
        min-w-[10rem] min-h-[2.5rem] max-h-[3rem]
        px-6 py-3 rounded-full
        text-[0.875rem] text-white/90
        bg-[#222222] border-none overflow-hidden
        cursor-pointer z-[1]
        focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    `;


    const renderContent = () => {
        if (!materialIconName) return <span>{label}</span>;
        const icon = <MaterialIcon name={materialIconName} />;
        const text = <span>{label}</span>;
        return iconPosition === 'left' ? (<>{icon}{text}</>) : (<>{text}{icon}</>);
    };

    return (
        <button
            className={`${baseClasses} ${className}`}
            onClick={OnClickCallback}
            disabled={disabled}
            type="button"
            aria-label={materialIconName ? `${label} with ${materialIconName} icon` : label}
        >
            {renderContent()}
        </button>
    );
}

export default Button
