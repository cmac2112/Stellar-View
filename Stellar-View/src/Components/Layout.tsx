import MaterialIcon from "./MaterialIcon.tsx";

interface LayoutProps {
    children?: React.ReactNode
    //title?: string come back to possibly later
}

export default function Layout ({ children }: LayoutProps) {
    return(
        <>
            <div
                className="min-w-screen bg-black flex p-2 items-center justify-end">
                <div id="menu-container">
                <span className="cursor-pointer hover:bg-purple-700 rounded-3xl transition-colors px-2 ">
                    <MaterialIcon name="question_mark" color="white" />
                </span>
                <span className="cursor-pointer p-5 hover:bg-purple-700 rounded-3xl transition-colors ">
                    <MaterialIcon name="menu" color="white" />
                </span>
                </div>
            </div>
            <div id="child-content">
                {children}
            </div>
        </>
    )
}