import { useEffect } from 'react';

/**
 * Custom hook to manage the canonical URL for a page.
 * It ensures only one canonical tag exists and updates it as needed.
 * 
 * @param {string} url - The absolute URL to set as canonical.
 */
const useCanonical = (url) => {
  useEffect(() => {
    if (!url) return;

    // Find existing canonical link or create a new one
    let link = document.querySelector('link[rel="canonical"]');
    
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }

    link.setAttribute('href', url);

    // Optional: Cleanup if the component unmounts?
    // Usually, we want it to persist or be overwritten by the next page's useCanonical.
  }, [url]);
};

export default useCanonical;
