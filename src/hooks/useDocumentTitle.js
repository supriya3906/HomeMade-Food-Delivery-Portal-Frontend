import { useEffect } from 'react';

/**
 * Custom hook to update document title per route
 * @param {string} title
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title
      ? `${title} | Homemade Food Delivery Portal`
      : 'Homemade Food Delivery Portal';

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
