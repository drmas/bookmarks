# Bookmark Manager

## Description
A modern bookmark management application built with Remix, featuring AI-powered summaries, text-to-speech capabilities, and efficient bookmark organization. The application allows users to save, categorize, and interact with their bookmarks in a sophisticated way.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Technical Documentation](#technical-documentation)
  - [Core Components](#core-components)
  - [API Services](#api-services)
  - [Database Schema](#database-schema)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/project.git

# Navigate to the project directory
cd project

# Install dependencies
npm install
```

## Environment Setup
The application requires several environment variables to be set:
```bash
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
# Add other required environment variables
```

## Technical Documentation

### Core Components

#### Bookmark Management System
The application uses a sophisticated bookmark management system with the following key features:

1. **Dynamic Query Builder** (`_index.tsx`)
```typescript
// Complex query builder that handles:
// - Folder filtering
// - Search functionality
// - Tag filtering
// - Custom sorting
let query_builder = supabase
  .from("bookmarks")
  .select(`
    *,
    folder:folders(name),
    tags:bookmark_tags(tag:tags(name))
  `)
```

2. **Bookmark Grid Component** (`BookmarkGrid.tsx`)
- Implements animated grid layout using Framer Motion
- Handles dynamic favicon loading with fallback
- Manages complex state for deletion operations

#### AI Integration Services

1. **Summary Generation** (`groq.server.ts`)
```typescript
export async function generateSummary(
  content: string,
  maxLength: number = 150,
  source: 'auto' | 'manual' = 'manual'
): Promise<SummaryResponse>
```
- Generates AI-powered summaries using the Groq API
- Handles rate limiting and error cases
- Provides metadata about processing time and content length

2. **Text-to-Speech Service** (`elevenlabs.server.ts`)
```typescript
export async function textToSpeech(
  text: string,
  voiceId = "I6FCyzfC1FISEENiALlo"
): Promise<TextToSpeechResponse>
```
- Converts text to natural-sounding speech
- Handles audio encoding and streaming
- Supports multiple voice options

### API Services

#### Bookmark Operations

1. **Create Bookmark** (`bookmarks.new.tsx`)
```typescript
export async function action({ request }: ActionFunctionArgs)
```
- Handles URL metadata extraction
- Generates automatic summaries
- Manages database transactions

2. **Update Bookmark** (`bookmarks.$id.tsx`)
- Supports real-time updates
- Handles concurrent modifications
- Implements optimistic UI updates

### Database Schema

#### Core Tables
1. **Bookmarks**
   - id: UUID (primary key)
   - user_id: UUID (foreign key)
   - url: string
   - title: string
   - description: text
   - summary: text
   - favicon: string
   - created_at: timestamp

2. **Folders**
   - id: UUID (primary key)
   - name: string
   - description: string (optional)

3. **Tags**
   - id: UUID (primary key)
   - name: string

### Error Handling

The application implements a comprehensive error handling system:

1. **Route Error Boundary** (`bookmarks.$id.tsx`)
- Handles 404 errors gracefully
- Provides user-friendly error messages
- Implements fallback UI components

2. **API Error Handling**
- Implements timeout handling
- Provides detailed error messages
- Handles rate limiting gracefully

## Development

### Running the Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## Contributing
Guidelines for contributing to the project.

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License
This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

## Support
For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments
- Remix framework for the foundation
- Supabase for database and authentication
- Groq for AI-powered summaries
- ElevenLabs for text-to-speech capabilities
- Framer Motion for animations

## Changelog
Document all notable changes to this project.

### [1.0.0] - YYYY-MM-DD
- Initial release
- Bookmark management system
- AI-powered summaries
- Text-to-speech integration
- Folder and tag organization
