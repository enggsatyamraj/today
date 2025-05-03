// src/components/OnboardingModal.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Clock, ArrowRight, CheckCircle, Sunrise, Sunset } from 'lucide-react';
import userSettingsService from '@/lib/user-settings-service';
import CircularTimePicker from './CircularTimePicker';

// Create a beautiful time picker for onboarding
function EnhancedTimePicker({ value, onChange, label, icon: Icon }) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = [0, 15, 30, 45];

    const [selectedHour, selectedMinute] = value.split(':').map(Number);

    // Convert to 12-hour time for display
    const period = selectedHour >= 12 ? 'PM' : 'AM';
    const displayHour = selectedHour % 12 || 12;

    return (
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                    <Icon className="h-5 w-5" />
                </div>
                <Label className="text-lg font-medium text-gray-800">{label}</Label>
            </div>

            <div className="flex items-center justify-center mt-3">
                <div className="flex items-center space-x-2 text-center">
                    <select
                        className="appearance-none bg-gray-50 border-0 text-center text-4xl font-light text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={selectedHour}
                        onChange={(e) => {
                            const newHour = e.target.value.padStart(2, '0');
                            const newMinute = selectedMinute.toString().padStart(2, '0');
                            onChange(`${newHour}:${newMinute}`);
                        }}
                    >
                        {hours.map(hour => (
                            <option key={hour} value={hour}>
                                {hour.toString().padStart(2, '0')}
                            </option>
                        ))}
                    </select>

                    <span className="text-4xl text-gray-500 font-light">:</span>

                    <select
                        className="appearance-none bg-gray-50 border-0 text-center text-4xl font-light text-gray-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={selectedMinute}
                        onChange={(e) => {
                            const newHour = selectedHour.toString().padStart(2, '0');
                            const newMinute = e.target.value.padStart(2, '0');
                            onChange(`${newHour}:${newMinute}`);
                        }}
                    >
                        {minutes.map(minute => (
                            <option key={minute} value={minute}>
                                {minute.toString().padStart(2, '0')}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-3 text-center text-gray-500 font-medium">
                {displayHour}:{selectedMinute.toString().padStart(2, '0')} {period}
            </div>
        </div>
    );
}

export default function OnboardingModal({ userId, isOpen, onComplete }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle completion
    const handleComplete = async () => {
        if (!userId) return;

        setIsSubmitting(true);
        try {
            // Save user settings
            await userSettingsService.updateUserSettings(userId, {
                work_start_time: startTime,
                work_end_time: endTime,
                auto_delete_tasks: true,
                remove_completed_tasks: true,
                onboarding_completed: true
            });

            // Notify parent component
            if (onComplete) {
                onComplete();
            }

            // Send to dashboard
            router.push('/dashboard');
        } catch (error) {
            console.error('Error saving onboarding settings:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render different steps
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="flex flex-col items-center max-w-4xl mx-auto py-6">
                        <div className="mb-6 text-center">
                            <div className="inline-block bg-blue-600 text-white p-4 rounded-2xl mb-6">
                                <Clock className="h-10 w-10" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-3">Welcome to Today Focus!</h1>
                            <p className="text-gray-600 max-w-lg mx-auto">
                                Let's personalize your experience to help you stay productive and focused.
                            </p>
                        </div>

                        <div className="w-full mb-10">
                            <h2 className="text-xl font-medium text-gray-700 mb-6 text-center">When do you usually work?</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                                <CircularTimePicker
                                    label="Start Time"
                                    value={startTime}
                                    onChange={setStartTime}
                                    icon={Sunrise}
                                />

                                <CircularTimePicker
                                    label="End Time"
                                    value={endTime}
                                    onChange={setEndTime}
                                    icon={Sunset}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={() => setStep(2)}
                            className="px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                        >
                            Continue
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                );

            case 2:
                return (
                    <div className="flex flex-col items-center max-w-4xl mx-auto py-6">
                        <div className="mb-10 text-center">
                            <div className="inline-block bg-green-600 text-white p-4 rounded-2xl mb-6">
                                <CheckCircle className="h-10 w-10" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-3">Stay Focused with Smart Cleanup</h1>
                            <p className="text-gray-600 max-w-lg mx-auto">
                                Today Focus helps you maintain clarity by automatically managing your tasks.
                            </p>
                        </div>

                        <div className="w-full bg-white/70 backdrop-blur-sm rounded-2xl p-8 mb-10 shadow-sm border border-gray-100 max-w-2xl">
                            <h2 className="text-xl font-medium text-gray-800 mb-6 flex items-center">
                                <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                                End of Day Cleanup
                            </h2>

                            <div className="space-y-4 ml-4">
                                <div className="flex items-start p-3 rounded-lg bg-green-50">
                                    <div className="bg-green-100 text-green-600 p-1 rounded-full mt-0.5 mr-3">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-green-800 font-medium">Completed tasks are cleared</p>
                                        <p className="text-green-600 text-sm">Makes room for tomorrow's priorities</p>
                                    </div>
                                </div>

                                <div className="flex items-start p-3 rounded-lg bg-blue-50">
                                    <div className="bg-blue-100 text-blue-600 p-1 rounded-full mt-0.5 mr-3">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-blue-800 font-medium">Unfinished tasks remain</p>
                                        <p className="text-blue-600 text-sm">Pick up where you left off</p>
                                    </div>
                                </div>

                                <div className="flex items-start p-3 rounded-lg bg-purple-50">
                                    <div className="bg-purple-100 text-purple-600 p-1 rounded-full mt-0.5 mr-3">
                                        <Sunrise className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-purple-800 font-medium">Happens at your end time: {endTime.split(':')[0]}:{endTime.split(':')[1]}</p>
                                        <p className="text-purple-600 text-sm">Automatically prepares for your next day</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-500 mt-6 text-sm text-center italic">
                                You can customize these settings anytime from your preferences.
                            </p>
                        </div>

                        <div className="flex space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                                className="px-6 py-2 rounded-xl"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="px-8 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                            >
                                {isSubmitting ? 'Setting up...' : 'Start Using Today Focus'}
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto bg-gradient-to-b from-gray-50 to-blue-50 border-none p-0">
                <div className="p-8">
                    {renderStepContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}