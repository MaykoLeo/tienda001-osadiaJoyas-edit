
"use client";

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

export function LiveVisitorCounter() {
    const [viewers, setViewers] = useState(0);

    useEffect(() => {
        const randomViewers = Math.floor(Math.random() * (45 - 8 + 1)) + 8;
        setViewers(randomViewers);

        const interval = setInterval(() => {
            setViewers(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                const newViewers = prev + change;
                return Math.max(5, newViewers);
            });
        }, 3000 + Math.random() * 2000);

        return () => clearInterval(interval);
    }, []);

    if (viewers === 0) return null;

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 animate-pulse">
            <Eye className="h-5 w-5" />
            <p className="font-semibold">{viewers} personas están viendo este artículo</p>
        </div>
    );
}
