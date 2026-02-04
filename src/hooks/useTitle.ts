import { useEffect } from 'react';

/**
 * Hook to set the document title
 * @param title The title to set
 */
export const useTitle = (title: string) => {
    useEffect(() => {
        const prevTitle = document.title;
        document.title = title;

        // Optional: Reset title on unmount
        return () => {
            document.title = prevTitle;
        };
    }, [title]);
};
