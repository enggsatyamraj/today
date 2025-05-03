// src/components/CircularTimePicker.jsx
'use client';

import { useState, useEffect } from 'react';
import { Clock, Check } from 'lucide-react';

export default function CircularTimePicker({ value, onChange, label, icon: Icon }) {
    const [hours, setHours] = useState(parseInt(value.split(':')[0], 10));
    const [minutes, setMinutes] = useState(parseInt(value.split(':')[1], 10));
    const [activeSelection, setActiveSelection] = useState('hours'); // 'hours' or 'minutes'
    const [period, setPeriod] = useState(hours >= 12 ? 'PM' : 'AM');

    // Calculate display hour (12-hour format)
    const displayHour = hours % 12 || 12;

    // Update value when hours/minutes change
    useEffect(() => {
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        onChange(`${formattedHours}:${formattedMinutes}`);
    }, [hours, minutes, onChange]);

    // Toggle between AM/PM (changes hour value accordingly)
    const togglePeriod = () => {
        if (period === 'AM') {
            setPeriod('PM');
            setHours(h => (h % 12) + 12); // Convert to PM
        } else {
            setPeriod('AM');
            setHours(h => h % 12); // Convert to AM (0 for 12 AM)
        }
    };

    // Build clock face numbers
    const clockNumbers = activeSelection === 'hours'
        ? Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i) // 12-hour clock
        : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]; // Minutes in 5-min increments

    // Handle clock number click
    const handleNumberClick = (num) => {
        if (activeSelection === 'hours') {
            // Convert 12-hour display to 24-hour format
            const newHours = num === 12 ? (period === 'AM' ? 0 : 12) : (period === 'PM' ? num + 12 : num);
            setHours(newHours);
            setActiveSelection('minutes'); // Move to minutes after selecting hours
        } else {
            setMinutes(num);
            setActiveSelection('hours'); // Go back to hours after selecting minutes
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full mr-3">
                    <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-medium text-gray-800">{label}</h3>
            </div>

            <div className="flex justify-center mb-4">
                <div className="flex items-center text-center">
                    <button
                        className={`text-3xl font-light px-3 py-1 rounded-lg ${activeSelection === 'hours' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                        onClick={() => setActiveSelection('hours')}
                    >
                        {displayHour}
                    </button>
                    <span className="text-3xl text-gray-500 font-light mx-1">:</span>
                    <button
                        className={`text-3xl font-light px-3 py-1 rounded-lg ${activeSelection === 'minutes' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                        onClick={() => setActiveSelection('minutes')}
                    >
                        {minutes.toString().padStart(2, '0')}
                    </button>
                    <button
                        className="ml-3 px-3 py-1 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200"
                        onClick={togglePeriod}
                    >
                        {period}
                    </button>
                </div>
            </div>

            {/* Circular clock face */}
            <div className="relative w-64 h-64 mx-auto mb-4">
                {/* Clock outer circle */}
                <div className="absolute inset-0 rounded-full border-2 border-gray-200 bg-white/70"></div>

                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-600"></div>

                {/* Clock hand */}
                <div
                    className="absolute top-1/2 left-1/2 w-1 bg-blue-600 origin-top rounded-full"
                    style={{
                        height: '40%',
                        transform: `rotate(${activeSelection === 'hours'
                            ? ((hours % 12) * 30 - 90)
                            : (minutes * 6 - 90)}deg)`,
                        transformOrigin: 'top',
                        left: 'calc(50% - 0.5px)'
                    }}
                ></div>

                {/* Clock numbers */}
                {clockNumbers.map((num, i) => {
                    // Calculate position on the circle
                    const angle = (i * 30) * (Math.PI / 180);
                    const radius = 42; // % of the circle size
                    const left = 50 + radius * Math.cos(angle);
                    const top = 50 + radius * Math.sin(angle);

                    // Check if this number is selected
                    const isSelected = activeSelection === 'hours'
                        ? (num === displayHour)
                        : (num === minutes);

                    return (
                        <button
                            key={num}
                            className={`absolute w-10 h-10 flex items-center justify-center rounded-full transform -translate-x-1/2 -translate-y-1/2 text-sm font-medium ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'
                                }`}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`
                            }}
                            onClick={() => handleNumberClick(num)}
                        >
                            {num.toString().padStart(2, '0')}
                        </button>
                    );
                })}
            </div>

            <div className="text-center text-gray-500">
                {displayHour}:{minutes.toString().padStart(2, '0')} {period}
            </div>
        </div>
    );
}