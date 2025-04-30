'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  CheckSquare,
  Calendar,
  BarChart2,
  Zap,
  LayoutDashboard,
  Settings,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function LandingPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  // Keep scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';

    const parts = user.email.split('@')[0].split(/[._-]/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Navbar */}
      <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-blue-600 text-white h-10 w-10 rounded-md flex items-center justify-center mr-3">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Today Focus</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" className="flex items-center">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

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
                      <ArrowRight className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up Free</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Focus on what matters <span className="text-blue-600">today</span>
              </h1>

              <p className="text-lg text-gray-600 md:text-xl leading-relaxed">
                Stay productive and organized with a simple, customizable task management system designed to help you focus on today&apos;s priorities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button size="lg" className="w-full sm:w-auto">
                        Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="bg-white rounded-xl shadow-xl p-6 relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2 text-blue-600" />
                    Today&apos;s Tasks
                  </h3>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { text: "Prepare client presentation", completed: true, badge: "High" },
                    { text: "Review team metrics", completed: false, badge: "In Progress" },
                    { text: "Update project documentation", completed: false, badge: "Not Started" },
                    { text: "Schedule team meeting", completed: true, badge: "Completed" },
                  ].map((task, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg flex items-center justify-between ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                        }`}
                    >
                      <div className="flex items-center">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-3 ${task.completed ? 'text-green-500' : 'text-gray-400'
                          }`}>
                          {task.completed ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <span className={task.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                          {task.text}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${task.badge === "High" ? 'bg-red-100 text-red-700' :
                        task.badge === "In Progress" ? 'bg-blue-100 text-blue-700' :
                          task.badge === "Completed" ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {task.badge}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      <span>2/4 completed</span>
                    </div>
                    <div className="flex items-center text-blue-600 font-medium">
                      <span>View All Tasks</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background elements for visual appeal */}
              <div className="absolute top-10 right-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 -z-10"></div>
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-green-200 rounded-full opacity-20 -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything you need to stay focused
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Today Focus combines simplicity with powerful customization to help you manage tasks your way.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Layers className="h-8 w-8 text-blue-600" />,
                title: "Custom Task Stages",
                description: "Create and customize your own task workflow stages to match your unique process."
              },
              {
                icon: <Clock className="h-8 w-8 text-indigo-600" />,
                title: "Time Tracking",
                description: "Track time spent on tasks to improve productivity and understand your work patterns."
              },
              {
                icon: <CheckCircle className="h-8 w-8 text-green-600" />,
                title: "Sub-tasks & Checklists",
                description: "Break down complex tasks into manageable sub-tasks and track progress."
              },
              {
                icon: <Calendar className="h-8 w-8 text-purple-600" />,
                title: "Daily Focus",
                description: "Organize your day with a clear view of what needs attention right now."
              },
              {
                icon: <BarChart2 className="h-8 w-8 text-orange-600" />,
                title: "Progress Insights",
                description: "Visual progress indicators help you stay motivated and on track."
              },
              {
                icon: <Zap className="h-8 w-8 text-yellow-600" />,
                title: "Fast & Responsive",
                description: "Lightning-fast performance across all devices, online or offline."
              },
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl border hover:shadow-md transition-shadow">
                <div className="bg-white w-16 h-16 rounded-lg shadow-sm flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Start focusing on what matters today
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of productive professionals who use Today Focus to organize their work and stay on track.
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" variant="default" className="bg-white text-blue-600 hover:bg-gray-100">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button size="lg" variant="default" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started for Free
              </Button>
            </Link>
          )}
          {!user && (
            <p className="mt-4 text-blue-200 text-sm">
              No credit card required • Free plan available
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="bg-blue-600 text-white h-8 w-8 rounded-md flex items-center justify-center mr-2">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">Today Focus</span>
            </div>

            <div className="flex space-x-6 mb-6 md:mb-0">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                About
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Pricing
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Help
              </a>
            </div>

            <div className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Today Focus. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}