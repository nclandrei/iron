'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                setError(result.error.message || 'Invalid email or password');
            } else {
                router.push('/workout');
            }
        } catch (err) {
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
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                autoFocus
                                className="text-base h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
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
                            Sign In
                        </Button>

{/* Sign up temporarily disabled
                        <p className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="font-medium text-foreground hover:underline">
                                Sign up
                            </Link>
                        </p>
*/}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
