/* The single definition of a page-level loading message. Nineteen pages used to write
   their own, in five different container/padding combinations around the same three
   words, so a page's loading state looked different depending on which page it was.
   `message` exists for the few places that say something more specific. */
interface LoadingStateProps {
  message?: string;
}

function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <p role="status" className="px-4 py-12 text-center text-sm text-ink-subtle sm:px-6 lg:px-8">
      {message}
    </p>
  );
}

export default LoadingState;
