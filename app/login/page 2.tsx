'use client';

import { useState } from 'react';
import { loginAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);

        try {
            const result = await loginAction(formData);
            if (result?.error) {
                setError(result.error);
            }
            // If no error, redirect() was called in the action and will navigate
        } catch (err) {
            // redirect() throws NEXT_REDIRECT error - don't show it as an error
            if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
                return; // This is a successful redirect, not an error
            }
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
            <Card className="w-full max-w-md border-2">
                <CardHeader className="text-center space-y-3 pb-8">
                    {/* Dumbbell Icon */}
                    <div className="flex justify-center">
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-foreground"
                        >
                            <path d="M6.5 6.5h11M6.5 17.5h11" />
                            <path d="M3 10V14M21 10V14" />
                            <rect x="5" y="5" width="3" height="14" rx="1" />
                            <rect x="16" y="5" width="3" height="14" rx="1" />
                            <line x1="9" y1="12" x2="15" y2="12" strokeWidth="2.5" />
                        </svg>
                    </div>

                    {/* App Name */}
                    <CardTitle className="text-4xl font-black tracking-tight">
                        IRON
                    </CardTitle>

                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                autoFocus
                                className="text-base h-11"
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive font-medium" role="alert">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold"
                            loading={isLoading}
                        >
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
