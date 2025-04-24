# OpenAPIBldr

A modern OpenAPI 3.1.x specification builder with a user-friendly form interface built with React 19, TypeScript, and shadcn/ui.

![OpenAPIBldr Screenshot](https://via.placeholder.com/800x450.png?text=OpenAPIBldr+Screenshot)

## Features

- **Form-based API Specification Building**: Create OpenAPI 3.1.x specifications without writing YAML or JSON manually
- **Real-time Preview**: See your API specification updated in real-time as you make changes
- **Multiple Export Formats**: Export your specification in both YAML and JSON formats
- **Local Storage Integration**: Your work is automatically saved to local storage to prevent data loss
- **Import Existing Specifications**: Import and edit existing OpenAPI specifications
- **Validation**: Immediate feedback on specification validity with detailed error reporting
- **Component Reuse**: Create reusable schemas and reference them throughout your API definition
- **Modern UI**: Sleek, responsive interface built with shadcn/ui and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher

### Installation

1. Clone the repository:

```bash
git clone https://github.com/mukezhz/openapibldr.git
cd openapibldr
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to http://localhost:5173 (or the port shown in your terminal).

## Building for Production

To build the application for production:

```bash
npm run build
```

The built assets will be available in the `dist` directory.

## Usage

OpenAPIBldr provides an intuitive interface for creating different sections of your OpenAPI specification:

### 1. API Info
Define basic information about your API:
- Title and description
- Version information
- Contact details
- License information
- Terms of service

### 2. Servers
Configure server URLs where your API is hosted:
- Multiple server environments (production, staging, development)
- Server descriptions
- Variable templating for dynamic server URLs

### 3. Paths
Define API endpoints and operations:
- HTTP methods (GET, POST, PUT, DELETE, etc.)
- Path parameters
- Operation summaries and descriptions
- Request body definitions with schema references
- Response definitions with status codes
- Tags for grouping operations

### 4. Components
Create reusable schemas and components:
- Data models/schemas
- Parameter definitions
- Response templates
- Request body templates
- Support for JSON Schema features

### 5. Export Options
Export your API specification in multiple formats:
- YAML format
- JSON format
- Direct copy to clipboard
- Downloadable files

The OpenAPIBldr interface is designed with a three-panel layout:
- **Left Panel**: Navigation menu for different specification sections
- **Middle Panel**: Forms for editing the current section
- **Right Panel**: Live preview of the complete OpenAPI specification in YAML or JSON

## Technologies Used

- React 19
- TypeScript
- Vite
- Monaco Editor for YAML editing
- shadcn/ui components
- Tailwind CSS
- Zod for form validation
- React Hook Form for form state management
- js-yaml for YAML conversion

## Project Structure

```
src/
├── components/
│   ├── forms/          # Form components for different OpenAPI sections
│   ├── import/         # Components for importing existing specifications
│   ├── preview/        # Preview components for viewing the specification
│   └── ui/             # Reusable UI components (shadcn/ui)
├── lib/
│   ├── types.ts        # TypeScript definitions for OpenAPI schema
│   └── utils/          # Utility functions
└── App.tsx             # Main application component
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenAPI Initiative](https://www.openapis.org/) for the OpenAPI Specification
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- All contributors to the project

## Roadmap

- Enhanced security definitions support
- OpenAPI specification validation improvements
- Multi-file component references
- API documentation generation
- Integration with API testing tools

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
