"use client";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();

    return (
        <main className="flex min-h-screen bg-natural items-center justify-center px-5 py-12">
            <section className="w-full max-w-xl text-center">
                <svg
                    viewBox="0 0 520 260"
                    role="img"
                    aria-label="404 page not found illustration"
                    className="mx-auto w-full max-w-lg"
                >
                    <g fill="var(--color-primary)" fillOpacity="0.12">
                        <path d="M56 82c0-12 10-22 22-22 10 0 18 6 21 15 3-2 7-3 11-3 12 0 21 9 21 20H56V82Z" />
                        <path d="M382 54c0-13 11-24 24-24 11 0 20 7 23 17 3-2 8-4 13-4 13 0 24 10 24 23h-84V54Z" />
                        <path d="M411 113c0-12 10-22 22-22 10 0 18 6 21 15 3-2 7-3 11-3 12 0 21 9 21 20h-75v-10Z" />
                    </g>

                    <g fill="var(--color-primary)">
                        <path d="M92 209 139 96h50l-22 75h22v38h-97Zm45-38h13l9-33-22 33Z" />
                        <path d="M327 209 374 96h50l-22 75h22v38h-97Zm45-38h13l9-33-22 33Z" />
                    </g>

                    <path
                        d="M207 209v-30c0-42 23-69 53-69s53 27 53 69v30h-30v-31c0-24-9-39-23-39s-23 15-23 39v31h-30Z"
                        fill="var(--color-primary)"
                        fillOpacity="0.12"
                        stroke="var(--color-primary)"
                        strokeWidth="4"
                    />
                    <path
                        d="M237 209v-31c0-24 9-39 23-39s23 15 23 39v31"
                        fill="none"
                        stroke="var(--color-primary)"
                        strokeWidth="4"
                    />

                    <g transform="rotate(-10 268 72)">
                        <rect
                            x="229"
                            y="27"
                            width="67"
                            height="78"
                            rx="3"
                            fill="#fff"
                            stroke="var(--color-primary)"
                            strokeWidth="3"
                        />
                        <path
                            d="M244 47h30M244 59h38M244 71h24"
                            stroke="var(--color-primary)"
                            strokeOpacity="0.5"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle
                            cx="291"
                            cy="86"
                            r="15"
                            fill="#fff"
                            stroke="var(--color-primary)"
                            strokeWidth="3"
                        />
                        <path
                            d="M291 78v9"
                            stroke="var(--color-primary)"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                        <circle cx="291" cy="92" r="2" fill="var(--color-primary)" />
                    </g>

                    <path
                        d="M70 210h380"
                        stroke="var(--color-primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <g
                        stroke="var(--color-primary)"
                        strokeOpacity="0.25"
                        strokeWidth="3"
                        strokeLinecap="round"
                    >
                        <path d="M112 231h43M178 231h25M318 231h39M382 231h30" />
                        <path d="M78 246h22M225 246h52M425 246h18" />
                    </g>
                </svg>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-300 sm:text-4xl">
                    Page Not Found
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
                    We&apos;re sorry, the page you requested could not be found. Please go
                    back to the homepage.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium uppercase tracking-wide text-white shadow-sm transition hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                        <Home className="h-4 w-4" />
                        Go Home
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-400 transition hover:text-primary cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </button>
                </div>
            </section>
        </main>
    );
}