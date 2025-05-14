// app/products/[id]/page.tsx

import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid';

interface Review {
  user: string;
  rating: number;
  comment: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  specifications: Record<string, string>;
  reviews: Review[];
  image_urls: string[];
  recommended_products?: Product[]; // Optional recommended products
}

interface ProductPageProps {
  product: Product;
}

export default function ProductPage({ product }: ProductPageProps) {
  const [mainImage, setMainImage] = useState(product.image_urls[0]);
  const [activeTab, setActiveTab] = useState('specifications');
  const [isMobile, setIsMobile] = useState(false);
  const imageGalleryRef = useRef<HTMLDivElement>(null);
  const specRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const recoRef = useRef<HTMLDivElement>(null);

  // Calculate average rating for structured data
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  // Structured data JSON-LD for SEO
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.image_urls,
    description: product.description,
    brand: { "@type": "Brand", name: "SmartKenya Online Shopping" },
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      url: `https://smartkenya.co.ke/products/${product.id}`,
    },
    aggregateRating: product.reviews.length > 0 && {
      "@type": "AggregateRating",
      ratingValue: averageRating.toFixed(1),
      reviewCount: product.reviews.length,
    },
  };

  // Handle window resize to detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth scroll thumbnails left or right
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (imageGalleryRef.current) {
      const scrollAmount = direction === 'right' ? 300 : -300;
      imageGalleryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Intersection Observer to switch tabs on scroll
  useEffect(() => {
    const sections = [
      { ref: specRef, id: 'specifications' },
      { ref: reviewRef, id: 'reviews' },
      { ref: recoRef, id: 'recommended' },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const sectionId = entry.target.getAttribute('data-section');
            if (sectionId) setActiveTab(sectionId);
          }
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach(({ ref, id }) => {
      if (ref.current) {
        ref.current.setAttribute('data-section', id);
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Scroll to section on tab click
  const scrollToSection = (section: string) => {
    const target =
      section === 'specifications'
        ? specRef.current
        : section === 'reviews'
        ? reviewRef.current
        : recoRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Head>
        <title>{`${product.name} | SmartKenya Online Shopping`}</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={mainImage} />
        <link rel="canonical" href={`https://smartkenya.co.ke/products/${product.id}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Product Title and Price */}
        <section className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">{product.name}</h1>
          <p className="text-3xl text-primary mt-2 font-semibold">
            KSh {product.price.toLocaleString('en-KE')}
          </p>
          <p className="mt-2 text-gray-700 max-w-3xl">{product.description}</p>
          <p className="mt-1 text-sm text-gray-500">
            Pay easily with M-PESA, Airtel Money, PayPal, and credit cards.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-10">
          {/* Left: Image Gallery */}
          <div className="relative">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
              <Image
                src={mainImage}
                alt={`${product.name} main image`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>

            {/* Desktop thumbnails with scroll buttons */}
            {!isMobile && product.image_urls.length > 1 && (
              <div className="relative mt-6">
                <button
                  aria-label="Scroll thumbnails left"
                  onClick={() => scrollThumbnails('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-2 rounded-full shadow-md hover:bg-primary hover:text-white transition"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <div
                  ref={imageGalleryRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-12"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {product.image_urls.map((img, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => setMainImage(img)}
                      className={`snap-center flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                        img === mainImage ? 'border-primary' : 'border-transparent'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        width={100}
                        height={100}
                        className="object-cover aspect-square"
                        loading="lazy"
                      />
                    </motion.button>
                  ))}
                </div>

                <button
                  aria-label="Scroll thumbnails right"
                  onClick={() => scrollThumbnails('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 p-2 rounded-full shadow-md hover:bg-primary hover:text-white transition"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Mobile thumbnails as simple scroll */}
            {isMobile && product.image_urls.length > 1 && (
              <div
                ref={imageGalleryRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory mt-4"
                style={{ scrollBehavior: 'smooth' }}
              >
                {product.image_urls.map((img, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`snap-center flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                      img === mainImage ? 'border-primary' : 'border-transparent'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      width={80}
                      height={80}
                      className="object-cover aspect-square"
                      loading="lazy"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Tabs and Content */}
          <div className="sticky top-20 self-start">
            {/* Tabs */}
            <nav className="flex gap-4 mb-6" aria-label="Product sections">
              {['specifications', 'reviews', 'recommended'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => scrollToSection(tab)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  aria-current={activeTab === tab ? 'true' : undefined}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>

            {/* Specifications Section */}
            <section
              ref={specRef}
              data-section="specifications"
              className="scroll-mt-28 mb-12"
              tabIndex={-1}
              aria-labelledby="specifications-heading"
            >
              <h2 id="specifications-heading" className="text-2xl font-semibold mb-4">
                Specifications
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                    <dt className="font-medium">{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Reviews Section */}
            <section
              ref={reviewRef}
              data-section="reviews"
              className="scroll-mt-28 mb-12"
              tabIndex={-1}
              aria-labelledby="reviews-heading"
            >
              <h2 id="reviews-heading" className="text-2xl font-semibold mb-6">
                Customer Reviews ({product.reviews.length})
              </h2>

              {product.reviews.length === 0 && (
                <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
              )}

              <ul className="space-y-6">
                {product.reviews.map((review, idx) => (
                  <li key={idx} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <p className="ml-3 font-semibold text-gray-800">{review.user}</p>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </li>
                ))}
              </ul>
            </section>

            {/* Recommended Products Section */}
            <section
              ref={recoRef}
              data-section="recommended"
              className="scroll-mt-28"
              tabIndex={-1}
              aria-labelledby="recommended-heading"
            >
              <h2 id="recommended-heading" className="text-2xl font-semibold mb-6">
                Recommended Products
              </h2>

              {product.recommended_products && product.recommended_products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {product.recommended_products.map((rec) => (
                    <a
                      key={rec.id}
                      href={`/products/${rec.id}`}
                      className="block border rounded-lg overflow-hidden shadow hover:shadow-lg transition"
                      aria-label={`View recommended product ${rec.name}`}
                    >
                      <div className="relative w-full aspect-square">
                        <Image
                          src={rec.image_urls[0]}
                          alt={rec.name}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{rec.name}</h3>
                        <p className="text-primary font-semibold mt-1">
                          KSh {rec.price.toLocaleString('en-KE')}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No recommendations available at this time.</p>
              )}
            </section>
          </div>
        </section>
      </main>

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        /* Primary color for your brand */
        :root {
          --primary: #1e40af; /* Customize to your brand color */
        }
        .text-primary {
          color: var(--primary);
        }
        .bg-primary {
          background-color: var(--primary);
        }
        .hover\\:bg-primary:hover {
          background-color: var(--primary);
        }
      `}</style>
    </>
  );
}
