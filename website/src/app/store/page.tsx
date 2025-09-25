// src/app/store/page.tsx
'use client';
// src/app/store/page.tsx
import Image from 'next/image';
import { products } from '@/mocks/products';
import { useState } from 'react';
import { Product } from '@/types/Product';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

// export const metadata = {
//   title: 'Art Store | Artful Archives Studio',
//   description: 'Browse and purchase unique artworks from our curated collection.',
// };

export default function StorePage() {
  const [cart, setCart] = useState<Product[]>([]);


  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const total = cart.reduce((sum, product) => sum + product.price, 0);

  return (
    <Layout>
   <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Art Store</h1>
      
      <div className="flex flex-wrap -mx-4">
        <aside className="w-full md:w-1/4 px-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ul>
                <li className="mb-2"><a href="#" className="text-blue-500 hover:underline">Abstract</a></li>
                <li className="mb-2"><a href="#" className="text-blue-500 hover:underline">Landscape</a></li>
                <li className="mb-2"><a href="#" className="text-blue-500 hover:underline">Portrait</a></li>
                <li className="mb-2"><a href="#" className="text-blue-500 hover:underline">Still Life</a></li>
              </ul>
            </CardContent>
          </Card>
        </aside>
        
        <section className="w-full md:w-3/4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <Image 
                    src={product.image} 
                    alt={product.title} 
                    width={300} 
                    height={200} 
                    className="w-full h-48 object-cover mb-4 rounded-t-lg"
                  />
                  <CardTitle>{product.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">${product.price}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => addToCart(product)}
                    className="w-full"
                  >
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Shopping Cart */}
        <aside className="w-full md:w-1/4 lg:w-1/4 px-4 mb-8 order-last md:order-none">
          <Card className="sticky top-8 shadow-lg">
            <CardHeader>
              <CardTitle>Shopping Cart</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="mb-4">
                {cart.map((product, index) => (
                  <li key={index} className="flex justify-between mb-2">
                    <span>{product.title}</span>
                    <span>${product.price}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${total}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Checkout
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>
    </div>
    </Layout>
  );
}
