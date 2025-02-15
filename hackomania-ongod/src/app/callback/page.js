"use client";
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const code = searchParams.get('code');
		const state = searchParams.get('state');
		const error = searchParams.get('error');
		if (error) {
			console.error("LinkedIn auth error:", error);
			return;
		}
		if (code) {
			fetch('/api/auth/linkedin/callback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code, state }),
			})
				.then(res => res.json())
				.then(data => {
					router.push('/dashboard');
				})
				.catch(err => {
					console.error("Error exchanging code:", err);
				});
		}
	}, [searchParams, router]);

	return (
		<div>
			<p>Loading...</p>
		</div>
	);
}

export default function CallbackPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CallbackContent />
		</Suspense>
	);
}
