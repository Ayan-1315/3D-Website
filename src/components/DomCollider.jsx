import React, { useEffect } from 'react';

export default function DomCollider({ elementRef }) {
  // placeholder: if you already have a DomCollider implementation, keep it.
  // This is a minimal no-op that only ensures ref consistency.
  useEffect(() => {
    // ensure we don't break when elementRef is null
    return () => {};
  }, [elementRef]);

  return null;
}
