import MaterialIcon from "./MaterialIcon.tsx";
import Menu from "./Menu.tsx";
import {useState} from "react";
interface LayoutProps {
    children?: React.ReactNode,
    title?: string
}

export default function Layout ({ children, title }: LayoutProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    const HandleMenuState = () => {
        setMenuOpen(!menuOpen);
    }

    return(
        <>
            <div
                className="min-w-screen bg-black flex p-2 items-center justify-end">
                <div id="menu-container">
                    {title && <span className="text-white mr-4 font-semibold">{title}</span>}
                <span onClick={HandleMenuState} className="cursor-pointer p-5 ">
                    <MaterialIcon name="menu" color="white" />
                </span>
                </div>
            </div>
            {menuOpen && (
                <Menu SetMenuState={setMenuOpen} menu={menuOpen} />
            )}
            <div id="child-content">
                {children}
            </div>
        </>
    )
}