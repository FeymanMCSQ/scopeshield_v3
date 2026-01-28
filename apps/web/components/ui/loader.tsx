"use client";

import { useEffect } from 'react';

export default function Loader({
    size = "45",
    speed = "1.75",
    color = "#059669" // emerald-600
}: {
    size?: string;
    speed?: string;
    color?: string;
}) {
    useEffect(() => {
        async function getLoader() {
            const { quantum } = await import('ldrs');
            quantum.register();
        }
        getLoader();
    }, []);

    return (
        // @ts-ignore - custom element
        <l-quantum
            size={size}
            speed={speed}
            color={color}
        ></l-quantum>
    );
}
