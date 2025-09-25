// src/app/about/page.tsx
import Image from 'next/image';
import { team } from '@/mocks/team';
import Layout from '@/components/Layout';

export const metadata = {
  title: 'About Us | Artful Archives Studio',
  description: 'Learn about our mission, history, and the team behind Artful Archives Studio.',
};

export default function Playground() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <div className="relative w-full h-64 mb-8">
          <Image
            src="/artboard1.png" // Update with the correct path to your banner image
            alt="Artful Archives Studio"
            layout="fill"
            objectFit="cover"
            objectPosition="center"
            className="rounded"
          />
        </div>



        <h1 className="text-4xl font-bold mb-8">Playground</h1>
        </div>
        </Layout>
  );
}