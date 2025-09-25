# Strapi Data Model for Artful Archives Blog

This document outlines the Strapi data model design that provides structure for the WordPress blog content while maintaining flexibility.

## Content Type: Article

The main content type for blog posts.

### Base Fields

These are the core fields that provide the essential structure:

| Field Name | Type | Description |
|------------|------|-------------|
| `title` | String (required) | Title of the blog post |
| `slug` | UID (required) | URL-friendly version of the title |
| `summary` | Text | Short summary/excerpt of the post |
| `publishedAt` | DateTime | Publication date |
| `updatedAt` | DateTime | Last update date |
| `author` | Relation to User | The author of the post |
| `featuredImage` | Media | Main image for the post |
| `status` | Enumeration | Draft, Published, Archived |
| `wordpressId` | Integer | Original WordPress post ID |
| `wordpressUrl` | String | Original WordPress URL |
| `seo` | Component | SEO metadata (title, description, etc.) |

### Content Blocks (Dynamic Zone)

This is where the flexibility comes in. The actual content is stored in a Dynamic Zone field called `contentBlocks` that can include any of the following components:

#### Text Block Component

| Field Name | Type | Description |
|------------|------|-------------|
| `content` | Rich Text | Formatted text content |
| `alignment` | Enumeration | Left, Center, Right, Justified |

#### Image Block Component

| Field Name | Type | Description |
|------------|------|-------------|
| `image` | Media (required) | The image file |
| `caption` | String | Image caption |
| `altText` | String | Alt text for accessibility |
| `fullWidth` | Boolean | Whether the image spans full width |

#### Gallery Block Component

| Field Name | Type | Description |
|------------|------|-------------|
| `images` | Media (multiple) | Collection of images |
| `layout` | Enumeration | Grid, Carousel, Masonry |
| `captions` | JSON | Captions keyed by image ID |

#### Quote Block Component

| Field Name | Type | Description |
|------------|------|-------------|
| `quote` | Rich Text | The quoted text |
| `attribution` | String | Who said the quote |
| `citation` | String | Source of the quote |
| `style` | Enumeration | Simple, Bordered, Highlighted |

#### Video Block Component

| Field Name | Type | Description |
|------------|------|-------------|
| `url` | String | URL to the video (YouTube, Vimeo, etc.) |
| `embedCode` | Text | Custom embed code |
| `caption` | String | Video caption |
| `autoplay` | Boolean | Whether to autoplay the video |

#### Code Block Component

| Field Name | Type | Description |
|------------|------|-------------|
| `code` | Text | The code snippet |
| `language` | String | Programming language |
| `showLineNumbers` | Boolean | Whether to show line numbers |

#### Custom HTML Component

| Field Name | Type | Description |
|------------|------|-------------|
| `html` | Text | Custom HTML code |
| `description` | String | Internal description of what this HTML does |

### Relations

| Field Name | Type | Description |
|------------|------|-------------|
| `categories` | Relation (many-to-many) | Categories the post belongs to |
| `tags` | Relation (many-to-many) | Tags associated with the post |
| `relatedPosts` | Relation (many-to-many) | Other related posts |

## Content Type: Category

| Field Name | Type | Description |
|------------|------|-------------|
| `name` | String (required) | Category name |
| `slug` | UID (required) | URL-friendly version of the name |
| `description` | Text | Category description |
| `featuredImage` | Media | Image representing the category |
| `parent` | Relation (self) | Parent category (for hierarchical categories) |
| `wordpressId` | Integer | Original WordPress category ID |

## Content Type: Tag

| Field Name | Type | Description |
|------------|------|-------------|
| `name` | String (required) | Tag name |
| `slug` | UID (required) | URL-friendly version of the name |
| `description` | Text | Tag description |
| `wordpressId` | Integer | Original WordPress tag ID |

## WordPress to Strapi Content Transformation

When importing content from WordPress to Strapi, the HTML content from WordPress will be parsed and transformed into appropriate content blocks:

1. Paragraphs → Text Block
2. Images → Image Block
3. Galleries → Gallery Block
4. Blockquotes → Quote Block
5. Video embeds → Video Block
6. Code blocks → Code Block
7. Custom HTML → Custom HTML Block
8. Unrecognized patterns → Preserved as Custom HTML

This approach ensures:
- WordPress content creators have full flexibility
- Front-end consumers have structured data
- Content can be rendered consistently across platforms
- Special formatting and layouts are preserved 