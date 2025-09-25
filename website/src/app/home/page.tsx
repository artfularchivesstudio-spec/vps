import React, { useRef, useEffect, useState } from "react";
import Layout from "@/components/Layout";


export default function Home() {

  return (
    <>
        <Layout>
          <h1 className="text-4xl font-bold mb-8">Welcome to Artful Archives Studio</h1>
          <p className="mb-8">Discover a curated collection of artworks, explore our blog for the latest trends in the art world, and visit our store to purchase unique pieces.</p>
        </Layout>
    </>
  );
}
