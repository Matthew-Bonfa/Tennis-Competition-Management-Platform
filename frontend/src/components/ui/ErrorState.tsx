import type { ReactNode } from 'react';

/* The page-level counterpart to LoadingState: the case where a page could not load at all.
   Six pages wrote the same bare centred red div for this, none of them inside a container,
   so the message spanned the full viewport with no side padding. `role="alert"` announces it,
   which the bare divs did not.

   The not-found states are deliberately not built on this. They are not errors — the record
   simply does not exist — and the app's not-found returns are not uniform enough to share one
   treatment yet: some carry a "back to" link, some sit inside a page shell. Each is handled in
   its own page's pass instead. */
interface ErrorStateProps {
  children: ReactNode;
}

function ErrorState({ children }: ErrorStateProps) {
  return (
    <div role="alert" className="px-4 py-12 text-center text-sm text-danger sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

export default ErrorState;
