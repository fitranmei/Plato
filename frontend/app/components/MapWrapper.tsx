'use client'; // Wajib ada di sini

import dynamic from 'next/dynamic';

const DynamicMapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center text-gray-500">
      Memuat Peta...
    </div>
  ),
});

export default function MapWrapper() {
  return <DynamicMapPicker />;
}