// src/app/blog/loading.tsx
import React from 'react';

// export default function BlogLoading() {
//   return (
//     <div className="max-w-4xl mx-auto px-4 py-8">
//       <h1 className="text-4xl font-bold mb-12">Blog.</h1>
//       <div className="grid gap-8">
//         {[1, 2].map((i) => (
//           <div key={i} className="animate-pulse border-b pb-8">
//             <div className="mb-4">
//               <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
//               <div className="h-4 bg-gray-200 rounded w-1/4"></div>
//             </div>
//             <div className="aspect-[16/9] bg-gray-200 rounded mb-4"></div>
//             <div className="space-y-2">
//               <div className="h-4 bg-gray-200 rounded w-full"></div>
//               <div className="h-4 bg-gray-200 rounded w-5/6"></div>
//               <div className="h-4 bg-gray-200 rounded w-4/6"></div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

export default function WordPressBlogLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="space-y-4 mb-8">
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="aspect-[16/9] bg-gray-200 rounded mb-8"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}