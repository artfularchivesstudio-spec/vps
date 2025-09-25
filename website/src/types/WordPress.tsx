// types/WordPress.ts

export interface WordPressPost {
    id: number;
    date: string;
    title: {
      rendered: string;
    };
    content: {
      rendered: string;
    };
    excerpt: {
      rendered: string;
    };
    slug: string;
    featured_media: number;
    _embedded?: {
      'wp:featuredmedia'?: Array<{
        source_url: string;
        media_details?: {
          sizes: {
            [key: string]: {
              source_url: string;
            };
          };
        };
      }>;
      author?: Array<{
        name: string;
      }>;
    };
  }