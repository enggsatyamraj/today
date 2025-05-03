// src/components/ui/time-picker.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export function TimePickerInput({
    value,
    onChange,
    className,
    disabled = false,
    ...props
}) {
    const inputRef = useRef(null);
    const [timeValue, setTimeValue] = useState(value || "");

    // Update internal state when prop changes
    useEffect(() => {
        if (value) {
            setTimeValue(value);
        }
    }, [value]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setTimeValue(newValue);

        // Only trigger onChange if the time format is valid
        if (isValidTimeFormat(newValue)) {
            onChange?.(newValue);
        }
    };

    // Validate time format (HH:MM in 24-hour format)
    const isValidTimeFormat = (time) => {
        const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return regex.test(time);
    };

    // Handle blur event to format time correctly
    const handleBlur = () => {
        if (timeValue && !isValidTimeFormat(timeValue)) {
            // Try to parse and fix the time format
            const fixedTime = tryFixTimeFormat(timeValue);
            if (fixedTime) {
                setTimeValue(fixedTime);
                onChange?.(fixedTime);
            } else {
                // Reset to the last valid value if unfixable
                setTimeValue(value || "");
            }
        }
    };

    // Try to fix common time format issues
    const tryFixTimeFormat = (time) => {
        // Remove all non-digit characters except colon
        const cleaned = time.replace(/[^\d:]/g, "");

        // If there's no colon, try to insert one
        if (!cleaned.includes(":")) {
            if (cleaned.length <= 2) {
                return `${cleaned.padStart(2, "0")}:00`;
            } else {
                const hours = cleaned.slice(0, 2);
                const minutes = cleaned.slice(2, 4).padEnd(2, "0");

                // Validate hours and minutes
                const hoursNum = parseInt(hours, 10);
                const minutesNum = parseInt(minutes, 10);

                if (hoursNum >= 0 && hoursNum < 24 && minutesNum >= 0 && minutesNum < 60) {
                    return `${hours}:${minutes}`;
                }
            }
        } else {
            const [hours, minutes] = cleaned.split(":");

            // Pad and validate
            const paddedHours = hours.padStart(2, "0");
            const paddedMinutes = (minutes || "00").slice(0, 2).padEnd(2, "0");

            const hoursNum = parseInt(paddedHours, 10);
            const minutesNum = parseInt(paddedMinutes, 10);

            if (hoursNum >= 0 && hoursNum < 24 && minutesNum >= 0 && minutesNum < 60) {
                return `${paddedHours}:${paddedMinutes}`;
            }
        }

        return null;
    };

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                type="text"
                placeholder="HH:MM"
                value={timeValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={cn("pr-10", className)}
                disabled={disabled}
                {...props}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-full px-3 text-gray-400"
                onClick={() => inputRef.current?.focus()}
                disabled={disabled}
            >
                <Clock className="h-4 w-4" />
            </Button>
        </div>
    );
}