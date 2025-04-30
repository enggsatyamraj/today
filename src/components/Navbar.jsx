'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    MenuIcon,
    X,
    LayoutDashboard,
    Settings,
    LogOut,
    CheckSquare
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Simplified navigation links - only Dashboard and Settings
    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
        { href: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4 mr-2" /> }
    ];

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.email) return 'U';

        const parts = user.email.split('@')[0].split(/[._-]/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }

        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    // Handle logout
    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // If no user, don't show the navbar
    if (!user) return null;

    return (
        <header
            className={`sticky top-0 z-40 w-full transition-all duration-200 ${scrolled
                    ? 'bg-white/95 backdrop-blur-md border-b shadow-sm'
                    : 'bg-white border-b'
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo and brand */}
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center">
                            <div className="bg-blue-600 text-white h-8 w-8 rounded-md flex items-center justify-center mr-2">
                                <CheckSquare className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Today Focus</span>
                        </Link>
                    </div>

                    {/* Desktop navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isActive
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User menu and mobile menu trigger */}
                    <div className="flex items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8 border border-gray-200">
                                        <AvatarFallback className="bg-blue-100 text-blue-700">
                                            {getUserInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-1 leading-none">
                                        {user.email && (
                                            <p className="font-medium text-sm text-gray-700">{user.email}</p>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/settings" className="flex items-center cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mobile menu trigger */}
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden ml-2">
                                    <MenuIcon className="h-6 w-6" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[80%] sm:w-[350px]">
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <div className="flex items-center">
                                            <div className="bg-blue-600 text-white h-8 w-8 rounded-md flex items-center justify-center mr-2">
                                                <CheckSquare className="h-5 w-5" />
                                            </div>
                                            <span className="text-xl font-bold">Today Focus</span>
                                        </div>
                                        <SheetTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <X className="h-5 w-5" />
                                                <span className="sr-only">Close</span>
                                            </Button>
                                        </SheetTrigger>
                                    </div>

                                    <div className="flex-1 mt-6">
                                        <nav className="flex flex-col space-y-2">
                                            {navLinks.map((link) => {
                                                const isActive = pathname === link.href;
                                                return (
                                                    <Link
                                                        key={link.href}
                                                        href={link.href}
                                                        className={`flex items-center px-3 py-3 text-base font-medium rounded-md ${isActive
                                                                ? 'text-blue-600 bg-blue-50'
                                                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                                                            }`}
                                                        onClick={() => setMobileOpen(false)}
                                                    >
                                                        {link.icon}
                                                        {link.label}
                                                    </Link>
                                                );
                                            })}
                                        </nav>
                                    </div>

                                    <div className="border-t pt-4 mt-6">
                                        <div className="flex items-center px-3 py-2">
                                            <Avatar className="h-10 w-10 border border-gray-200">
                                                <AvatarFallback className="bg-blue-100 text-blue-700">
                                                    {getUserInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <button
                                                onClick={() => {
                                                    setMobileOpen(false);
                                                    handleSignOut();
                                                }}
                                                className="w-full flex items-center px-3 py-2 text-base font-medium rounded-md text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut className="h-4 w-4 mr-2" />
                                                Log out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}