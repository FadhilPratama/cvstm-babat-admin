// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api(.*)',
]);

export default clerkMiddleware(async (authPromise, req) => {
    // 🔹 Tunggu promise selesai, baru ambil `protect()`
    const { protect } = await authPromise;

    // 🔹 Lindungi route non-public
    if (!isPublicRoute(req)) {
        protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|png|gif|svg|ico|woff2?|ttf|txt)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
