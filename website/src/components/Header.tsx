// src/components/Header.tsx
import Link from 'next/link';
import Image from 'next/image';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'Playground', href: '/playground' },
  { name: 'Art Store', href: '/store' },
  { name: 'About', href: '/about' },
];

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-white shadow">
      <div className="flex items-center">
        <Image src="/logo-blob.png" alt="Artful Archives Studio Logo" width={40} height={40} className="mr-2" />
        <span className="text-xl font-semibold">Artful Archives Studio</span>
      </div>
      <nav>
        <ul className="flex space-x-4">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link href={item.href} className="hover:text-gray-600 transition-colors">
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}