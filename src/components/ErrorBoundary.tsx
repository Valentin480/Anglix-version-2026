import React, { useState, useEffect, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(event.reason);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  if (hasError) {
    let message = "Une erreur inattendue est survenue.";
    
    try {
      const firestoreError = JSON.parse(error?.message || '');
      if (firestoreError.operationType) {
        message = "Erreur de synchronisation avec la base de données. Vérifiez vos permissions.";
      }
    } catch (e) {
      // Not a JSON error
    }

    return (
      <div className="min-h-screen bg-[#FF6321] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[32px] border-8 border-black shadow-[0_12px_0_rgba(0,0,0,1)] max-w-md text-center">
          <h2 className="text-3xl font-black uppercase italic mb-4">Oups !</h2>
          <p className="font-bold text-gray-600 mb-8">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
