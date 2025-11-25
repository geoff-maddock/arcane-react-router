import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';

type NavigationContextValue = {
    previousPath: string | null;
};

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

function getInitialPreviousPath(): string | null {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return null;
    }

    try {
        if (!document.referrer) {
            return null;
        }

        const referrerUrl = new URL(document.referrer);

        if (referrerUrl.origin !== window.location.origin) {
            return null;
        }

        return `${referrerUrl.pathname}${referrerUrl.search}${referrerUrl.hash}`;
    } catch {
        return null;
    }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
    const location = useLocation();
    const [previousPath, setPreviousPath] = useState<string | null>(() => getInitialPreviousPath());
    const [currentPath, setCurrentPath] = useState<string | null>(null);

    useEffect(() => {
        const newPath = `${location.pathname}${location.search}${location.hash}`;

        if (currentPath && currentPath !== newPath) {
            setPreviousPath(currentPath);
        }
        setCurrentPath(newPath);
    }, [location, currentPath]);

    const value = useMemo<NavigationContextValue>(() => ({ previousPath }), [previousPath]);

    return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBackNavigation(fallbackPath: string) {
    const context = useContext(NavigationContext);

    // If used outside provider, just return fallback
    if (!context) {
        return { backHref: fallbackPath, isFallback: true };
    }

    const { previousPath } = context;
    const backHref = previousPath ?? fallbackPath;
    const isFallback = !previousPath;

    return { backHref, isFallback };
}
