import React, {useCallback} from 'react'
import {useNavigate} from 'react-router-dom'
import Button from './Button';
import "./Menu.css"

interface MenuProps {
    menu: boolean;
    SetMenuState: (state: boolean) => void;
}

const Menu:React.FC<MenuProps> = ({
    menu, SetMenuState}) => {

    const navigate = useNavigate();
    const isMobileDevice = (): boolean => {
        return window.innerWidth <= 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };
    const handleNavigation = useCallback((route: string) => {
        //delay to allow for button animation to play before navigating
        const delayTime = isMobileDevice() ? 800 : 0;

        setTimeout(() => {
            navigate(route);
        }, delayTime);
    }, [navigate]);

    const handleCloseMenu = () => {
        const delayTime = isMobileDevice() ? 800 : 0;

        setTimeout(() => {
            SetMenuState(!menu);
        }, delayTime);
    }

    return (
        <div className='menu-modal'>
            <div className='button-container flex flex-col gap-2'>
                <Button className='w-full' label="Home" iconPosition='right' OnClickCallback={() => handleNavigation("/")} materialIconName='home' />
                <Button className='w-full' label="Big Image Viewer" iconPosition='right' OnClickCallback={() => handleNavigation("/image-view")} materialIconName='4k_plus' />
                <Button className='w-full' label="Satellite View" iconPosition='right' OnClickCallback={() => handleNavigation("/planet-view")} materialIconName='satellite_alt' />
                <Button className='w-full' label="Experimental View" iconPosition='right' OnClickCallback={() => handleNavigation("/experimental-view")} materialIconName='warning' />
                <Button className='w-full' label="Gitub Repository" iconPosition='right' OnClickCallback={() => window.open("https://github.com/cmac2112/Stellar-View", "_blank")}  materialIconName='code' />
                <Button className='w-full' label="Close" iconPosition='right' OnClickCallback={() => handleCloseMenu()} materialIconName='close' />
            </div>
        </div>
    )
}

export default Menu