# Database Setup Guide

## Prerequisites

1. Node.js and npm installed
2. Supabase account and project
3. Supabase CLI (optional, for local development)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Migration

1. **Run the migration script**:
   ```bash
   npx ts-node scripts/seed-database.ts
   ```

2. **Verify the data**: Check your Supabase dashboard to ensure all tables and data were created successfully.

## Troubleshooting

- **Missing permissions**: Ensure your service role key has the necessary permissions.
- **Connection issues**: Verify your Supabase URL and keys are correct.
- **Schema errors**: Check the SQL migration file for any syntax errors.
