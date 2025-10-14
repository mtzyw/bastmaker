# Project Overview

This is a Next.js project that provides a template for building an AI image generation website. It uses [Nexty](https://github.com/WeNextDev/nexty.dev) as a full-stack template and [Flux Kontext](https://replicate.com/search?query=flux-kontext) for AI image generation.

## Main Technologies

*   **Framework:** [Next.js](https://nextjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Radix UI](https://www.radix-ui.com/)
*   **Database and Authentication:** [Supabase](https://supabase.com/)
*   **Payments:** [Stripe](https://stripe.com/)
*   **AI Image Generation:** [Replicate](https://replicate.com/)
*   **Internationalization:** [next-intl](https://next-intl-docs.vercel.app/)

## Architecture

The project is a full-stack Next.js application. The frontend is built with React and Tailwind CSS, and the backend is handled by Next.js API routes. Supabase is used for the database and user authentication. Stripe is integrated for handling payments for different subscription plans. The core AI image generation functionality is implemented using Replicate's API.

# Building and Running

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 20 or later)
*   [pnpm](https://pnpm.io/)
*   [Supabase CLI](https://supabase.com/docs/guides/cli)

## Key Commands

*   **Install dependencies:**
    ```bash
    pnpm install
    ```
*   **Run the development server:**
    ```bash
    pnpm dev
    ```
*   **Create a production build:**
    ```bash
    pnpm build
    ```
*   **Start the production server:**
    ```bash
    pnpm start
    ```
*   **Run linting:**
    ```bash
    pnpm lint
    ```
*   **Analyze the bundle size:**
    ```bash
    pnpm analyze
    ```

## Supabase Commands

*   **Push database changes:**
    ```bash
    pnpm db:push
    ```
*   **Pull database changes:**
    ```bash
    pnpm db:pull
    ```
*   **Reset the database:**
    ```bash
    pnpm db:reset
    ```
*   **Create a new migration:**
    ```bash
    pnpm db:new-migration
    ```
*   **Generate TypeScript types from the database schema:**
    ```bash
    pnpm db:gen-types
    ```
*   **Log in to Supabase:**
    ```bash
    pnpm db:login
    ```
*   **Link the project to a Supabase project:**
    ```bash
    pnpm db:link
    ```
*   **Update the database and generate types:**
    ```bash
    pnpm db:update
    ```

# Development Conventions

*   **Coding Style:** The project uses ESLint to enforce a consistent coding style.
*   **Testing:** There are no explicit testing practices mentioned in the documentation.
*   **Contribution:** There are no explicit contribution guidelines mentioned in the documentation.
