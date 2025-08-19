# Roboto Studio backend tech test

## About Us

Our mission at Roboto Studio is to create the best editorial experiences on the web using bleeding edge technology & artificial intelligence. We want to make the bleeding edge accessible to all, and to break down the barriers between developers, designers, and content creators.

## Welcome

Congratulations on being selected for this tech test. This repository contains a tech test with three distinct implementation tasks designed to showcase your backend development skills with Next.js, Sanity CMS, and external API integrations.

**Time Expectation**: We estimate this test will take approximately 8-16 hours to complete, depending on your familiarity with the technologies involved.

**AI Usage Policy**: We encourage the use of AI tools (ChatGPT, Claude, Copilot, etc.) to assist with your development process. However, please be prepared to explain and walk through any code you submit, as we'll discuss your implementation choices and reasoning during the technical interview.

Please complete all three tasks to demonstrate your technical capabilities.

## Task 1: Algolia Search Integration

**Objective**: Implement a search engine for blog posts using Algolia's free tier.

**Requirements**:

- **Search Interface**: Add a search component at the top of the `/blog` page
- **Content Indexing**: Index all blog posts from Sanity CMS into Algolia
- **Real-time Search**: Provide instant search results as users type
- **Search Results**: Display matching blog posts with titles, excerpts, and links
- **Free Tier Usage**: Use Algolia's free plan (10,000 records, 10,000 operations/month)
- **Bonus Feature**: Implement caching to speed up repeat searches for the same query

**Expected Deliverables**:

- Algolia account setup and configuration
- Blog post indexing script or automation
- Search UI component on the blog page
- Search results display with proper styling
- Optional: Query result caching mechanism

## Task 2: Category System Implementation

**Objective**: Create a category-based navigation system similar to Roboto Studio's blog categorization.

**Requirements**:

- **Category Schema**: Add category fields to blog post documents in Sanity
- **Category Routes**: Implement dynamic routes like `/blog/[category]` (e.g., `/blog/sanity`, `/blog/nextjs`)
- **Category Pages**: Display filtered blog posts by category with proper pagination
- **Navigation**: Add category filters or navigation to the blog index page
- **URL Structure**: Clean, SEO-friendly URLs matching the pattern shown in the example
- **Reference Implementation**: Study and replicate the category system from [robotostudio.com/blog/sanity](https://robotostudio.com/blog/sanity)
- **Bonus Feature**: Create categories as separate Sanity documents with custom SEO title/description overrides

**Expected Deliverables**:

- Updated Sanity schema with category support
- Dynamic category route implementation
- Category filtering functionality
- Category navigation UI
- SEO-optimized category pages

## Task 3: Pokemon Async Component

**Objective**: Create a custom Sanity field type with async Pokemon search functionality using PokeAPI.

**Requirements**:

- **Custom Sanity Schema**: Create a Pokemon object type for storing Pokemon data
- **Studio Component**: Build an async Pokemon selector with debounced search (300ms)
- **API Integration**: Real-time calls to [PokeAPI](https://pokeapi.co/) (`https://pokeapi.co/api/v2/pokemon/{name}`)
- **Data Storage**: Store Pokemon ID, name, types, sprite URL in Sanity documents
- **Frontend Display**: Show selected Pokemon data on the `/blog` page for testing
- **Loading States**: Proper loading and error handling in Studio interface

**Expected Deliverables**:

- Custom Sanity schema with Pokemon field type
- Async Studio component for Pokemon search and selection
- Frontend Pokemon display component on blog page
- PokeAPI integration with proper error handling
- TypeScript typing for Pokemon data structure

## Submission Requirements

### ⏰ Expected Completion: 1 week

Once you've completed all three tasks, please provide the following:

- **Live Demo**: Deploy your solution to Vercel and share the live URL
- **Source Code**: Share your GitHub repository link with all implemented features
- **Schedule Interview**: Book your technical interview to discuss your implementation at [cal.com/roboto/interview](https://cal.com/roboto/interview)

---

Use our implementation of Sanity + Next.js to get this up and running the fastest below. For full documentation and setup instructions, see the [complete README on GitHub](https://github.com/robotostudio/turbo-start-sanity).

# Next.js Monorepo with Sanity CMS

A modern, full-stack monorepo template built with Next.js App Router, Sanity CMS, Shadcn UI, and TurboRepo.

![Easiest way to build a webpage](https://raw.githubusercontent.com/robotostudio/turbo-start-sanity/main/turbo-start-sanity-og.png)
