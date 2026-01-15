import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';
import { Loader2 } from 'lucide-react';

// Loading fallback for Suspense boundary
function HomePageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePage />
    </Suspense>
  );
}
