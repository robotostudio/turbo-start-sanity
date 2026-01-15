# Backend Technical Test

Welcome to the Roboto Studio backend technical assessment. This test is designed to evaluate your ability to work with Next.js, Sanity CMS, third-party APIs, and your approach to building production-ready features.

## Setup

Before starting the test, please follow the [installation instructions on the main branch](https://github.com/robotostudio/turbo-start-sanity/tree/main#getting-started) to get the project running locally.

Once you have the project running with sample content, you're ready to begin.

---

## The Test

You have **three tasks** to complete. Each task builds upon the existing blog system in this monorepo.

### Task 1: Blog Categories & Filtering

Implement a category system for blog posts.

**Requirements:**

- Add a category field to blog posts in Sanity (create the category schema as you see fit)
- Create the necessary routes in Next.js to support category-based navigation
- Build a filter UI at the top of the blog index page that allows users to filter posts by category
- Categories should be clickable/selectable and the page should update to show only matching posts
- Consider URL structure and how users might share filtered views

**Reference:** Take inspiration from [robotostudio.com/blog](https://robotostudio.com/blog) but aim to improve upon it with better UX and functionality.

---

### Task 2: Blog Search with Algolia

Implement search functionality for the blog using Algolia.

**Requirements:**

- Set up Algolia and index the blog posts
- Add a search input at the top of the blog index page
- The search should be reactive - results should update as the user types
- Search results should be relevant and the experience should feel snappy
- Consider how search interacts with the category filters from Task 1

**Resources:** You'll need to create a free Algolia account at [algolia.com](https://www.algolia.com/)

---

### Task 3: Pokémon Integration

Add a unique Pokémon to each blog post using the PokéAPI.

**Requirements:**

- Each blog post should have an associated Pokémon
- Display the Pokémon's sprite image at the top of each blog post page
- The Pokémon should be configurable per post (e.g., the "hello-world" post might feature Pikachu)
- Consider how to store this association and how content editors would assign Pokémon to posts

**Resources:** [PokéAPI Documentation](https://pokeapi.co/)

---

## Submission

1. Create a new branch with your changes
2. Commit your work with clear, meaningful commit messages
3. Push your branch and open a pull request against this branch (`backend-tech-test`)
4. In your PR description, include:
   - Any assumptions you made
   - Trade-offs you considered
   - What you would improve given more time

---

## Evaluation Criteria

We're looking at:

- **Code quality** - Clean, readable, maintainable code
- **Problem solving** - How you approach and break down the tasks
- **Attention to detail** - Edge cases, error handling, user experience
- **Technical decisions** - Your choices and ability to justify them
- **Git hygiene** - Commit history and PR quality

Good luck!
