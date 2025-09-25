# Swedbank Content Studio - Workspace Configuration

This Sanity Studio is configured with multiple workspaces to serve different websites and regions for Swedbank and Sparebanken Skåne.

## Workspaces

### Swedbank Workspaces

1. **Swedbank (English)** - `/swedbank-en`
   - Target: International English-speaking markets
   - URL: `https://your-studio-url.com/swedbank-en`

2. **Swedbank (Svenska)** - `/swedbank-sv`
   - Target: Swedish market
   - URL: `https://your-studio-url.com/swedbank-sv`

3. **Swedbank (Baltic)** - `/swedbank-baltic`
   - Target: Baltic region (Estonia, Latvia, Lithuania)
   - URL: `https://your-studio-url.com/swedbank-baltic`

### Sparebanken Skåne Workspace

4. **Sparebanken Skåne** - `/sparebanken-skane`
   - Target: Skåne region, Sweden
   - URL: `https://your-studio-url.com/sparebanken-skane`

## Dataset Structure

All workspaces share a single dataset (`production` by default) for simplified content management. Content separation is handled through:

- **Structure view organization** - Different content types and sections for each workspace
- **Custom roles and permissions** - User access control per workspace
- **Content categorization** - Fields to identify content for specific regions/brands

## Development

To work with a specific workspace, you can:

1. **Start the development server:**

   ```bash
   pnpm dev
   ```

2. **Access specific workspaces:**
   - Navigate to `http://localhost:3333/swedbank-en` for English workspace
   - Navigate to `http://localhost:3333/swedbank-sv` for Swedish workspace
   - Navigate to `http://localhost:3333/swedbank-baltic` for Baltic workspace
   - Navigate to `http://localhost:3333/sparebanken-skane` for Sparebanken Skåne workspace

## Environment Variables

Make sure to set the following environment variables:

```env
SANITY_STUDIO_PROJECT_ID=your-project-id
SANITY_STUDIO_DATASET=production  # Shared dataset for all workspaces
```

## Content Management

All workspaces share:

- **Single dataset** for simplified content management
- **Shared content types and schemas** with workspace-specific organization
- **Common media assets** with categorization
- **Unified preview configurations** with workspace-specific URLs

Content separation is achieved through:

- **Structure view organization** - Different sections for each workspace
- **Custom roles and permissions** - User access control per workspace
- **Content categorization fields** - Identify content for specific regions/brands
- **Workspace-specific presentation URLs** - Different front-end integrations

## Next Steps

1. Create content schemas specific to banking/financial services
2. Set up preview URLs for each workspace
3. Configure user permissions and roles
4. Set up content workflows and approval processes
5. Integrate with front-end applications for each region/brand
