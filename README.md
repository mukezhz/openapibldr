# OpenAPIBldr

A modern OpenAPI 3.1.x specification builder with a user-friendly form interface built with React 19, TypeScript, and shadcn/ui.

## Features

- Generate OpenAPI 3.1.x specifications through easy-to-use forms
- Real-time preview of the generated OpenAPI specification
- Export to YAML or JSON format
- Intuitive interface for managing API information, servers, paths, and more
- Modern UI built with shadcn/ui components

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

OpenAPIBldr provides a tabbed interface for creating different sections of your OpenAPI specification:

1. **API Info**: Define basic information about your API including title, description, version, contact information, and license.

2. **Servers**: Configure server URLs where your API is hosted.

3. **Paths**: Define API endpoints, HTTP methods, request parameters, and responses.

4. **Components** (Coming Soon): Create reusable schemas, parameters, responses, and more.

5. **Security** (Coming Soon): Define security requirements for your API.

The generated OpenAPI specification is displayed in real-time on the right panel, and can be exported in either YAML or JSON format.

## Technologies Used

- React 19
- TypeScript
- Vite
- shadcn/ui
- Tailwind CSS
- Zod for form validation
- js-yaml for YAML conversion

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

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
