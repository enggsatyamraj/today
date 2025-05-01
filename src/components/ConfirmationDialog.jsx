'use client';

import React from 'react';
import {
    AlertCircle,
    X,
    CheckCircle,
    AlertTriangle,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning' // 'warning', 'error', 'success', 'info'
}) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'error':
                return <AlertCircle className="h-8 w-8 text-red-500" />;
            case 'success':
                return <CheckCircle className="h-8 w-8 text-green-500" />;
            case 'info':
                return <Info className="h-8 w-8 text-blue-500" />;
            case 'warning':
            default:
                return <AlertTriangle className="h-8 w-8 text-amber-500" />;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
            case 'warning':
            default:
                return 'bg-amber-50 border-amber-200';
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'error':
                return 'bg-red-600 hover:bg-red-700';
            case 'success':
                return 'bg-green-600 hover:bg-green-700';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-700';
            case 'warning':
            default:
                return 'bg-amber-600 hover:bg-amber-700';
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
            <Card className={`max-w-md w-full ${getColor()} shadow-lg border-2 animate-in fade-in zoom-in-95 duration-300`}>
                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                    {getIcon()}
                    <div className="flex-1">
                        <CardTitle className="text-lg">{title}</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 rounded-full"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent>
                    <p className="text-sm text-gray-700">{message}</p>
                </CardContent>

                <CardFooter className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        className={getButtonColor()}
                        size="sm"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}