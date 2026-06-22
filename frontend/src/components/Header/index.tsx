import { Button } from "@/components/Shadcn/Button/button";
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/Shadcn/Drawer/drawer";
import { Logo } from "@components/Header/Logo";
import { NavigationMenuSection } from "@/components/Header/NavigationMenuSection";
import { ThemeToggle } from "@components/Header/ThemeToggle";
import { UserProfileSection } from "@components/Header/UserProfileSection";
import { mobileDrawerNavClassName } from "@/components/Header/constants";
import { Bars3Icon } from "@heroicons/react/20/solid";

const Header = () => (
    <header className="fixed inset-x-0 top-0 z-50 w-full">
        <div className="border-b border-n-30 bg-n-0 dark:border-border-default dark:bg-black">
            <nav className="relative mx-auto flex h-16 items-center px-20">
                <Logo />

                <div className="mx-5 hidden h-8 w-px shrink-0 bg-n-30 dark:bg-border-default nav:block" />

                <div className="hidden min-w-0 flex-1 nav:flex">
                    <NavigationMenuSection />
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2 nav:gap-3">
                    <Drawer direction="left">
                        <DrawerTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="nav:hidden"
                                aria-label="Open navigation menu"
                            >
                                <Bars3Icon className="size-5" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="flex w-full flex-col sm:max-w-xs">
                            <DrawerTitle className="sr-only">Navigation</DrawerTitle>
                            <div className={mobileDrawerNavClassName}>
                                <NavigationMenuSection inDrawer />
                            </div>
                            <div className="mt-auto flex items-center gap-3 border-t border-n-30 p-4 pt-6 dark:border-border-default">
                                <div className="min-w-0 flex-1">
                                    <UserProfileSection inDrawer />
                                </div>
                                <ThemeToggle />
                            </div>
                        </DrawerContent>
                    </Drawer>

                    <div className="hidden items-center gap-2 nav:flex nav:gap-3">
                        <UserProfileSection />
                        <ThemeToggle />
                    </div>
                </div>
            </nav>
        </div>
    </header>
);

export default Header;
