// src/app/about/page.tsx
import Image from 'next/image';
import { team } from '@/mocks/team';

export const metadata = {
  title: 'About Us | Artful Archives Studio',
  description: 'Learn about our mission, history, and the team behind Artful Archives Studio.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">About Artful Archives Studio</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our History</h2>
        <p className="mb-4">Artful Archives Studio was founded in 2010 with a vision to nurture and promote artistic talents. Over the years, we have grown into a vibrant community of artists, each contributing their unique style and perspective to the art world.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="mb-4">Our mission is to foster creativity, support emerging artists, and bring compelling art to a broader audience. We believe in the transformative power of art and aim to make it accessible to everyone.</p>
        <p>Through our initiatives, we strive to create a supportive environment where artists can collaborate, innovate, and thrive. We are committed to promoting diversity and inclusion in the art community, ensuring that all voices are heard and valued.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-8">Meet Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member) => (
            <div key={member.id} className="text-center">
              <Image 
                src={member.image} 
                alt={member.name} 
                width={150} 
                height={150} 
                className="rounded-full mx-auto mb-4"
              />
              <h3 className="text-xl font-medium">{member.name}</h3>
              <p className="text-gray-600">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}