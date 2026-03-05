import { Link } from "@tanstack/react-router";
import { buttonVariants } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <img
                        src="/public/applogo.png"
                        alt="App Start logo"
                        className="size-8"
                    />
                    <h1 className="text-lg font-semibold">Recall</h1>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link to="/login" className={buttonVariants({ variant: 'secondary'})}>
                        Login
                    </Link>
                    <Link to="/signup" className={buttonVariants()}>
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>
    );
}