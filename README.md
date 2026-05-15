# By-Import

A powerful, scalable data import and integration platform designed for business automation. By-Import streamlines the process of importing, validating, and transforming data from multiple sources.

## Features

- **Multi-Format Support**: Import from CSV, Excel, JSON, XML, and databases
- **Data Validation**: Built-in validation rules and custom validators
- **Data Transformation**: Map and transform data during import
- **Batch Processing**: Handle large-scale imports with streaming
- **Error Handling**: Comprehensive error reporting and recovery
- **API Integration**: RESTful API for automation
- **Scheduled Imports**: Schedule recurring imports
- **Audit Trail**: Complete audit log of all imports
- **Multi-Database Support**: PostgreSQL, MySQL, MongoDB, DynamoDB

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## API Endpoints

### Imports
- `GET /api/imports` - List all imports
- `POST /api/imports` - Create new import
- `GET /api/imports/:id` - Get import details
- `PUT /api/imports/:id` - Update import
- `DELETE /api/imports/:id` - Delete import

### Data Sources
- `GET /api/sources` - List all data sources
- `POST /api/sources` - Create new source
- `GET /api/sources/:id` - Get source details
- `PUT /api/sources/:id` - Update source

### Transformations
- `GET /api/transformations` - List all transformations
- `POST /api/transformations` - Create transformation
- `POST /api/transformations/:id/apply` - Apply transformation

### Jobs
- `GET /api/jobs` - List all import jobs
- `POST /api/jobs` - Start new import job
- `GET /api/jobs/:id` - Get job status
- `POST /api/jobs/:id/cancel` - Cancel running job

## Configuration

See `.env.example` for all configuration options.

## Documentation

For detailed documentation, visit [docs/](./docs/)

## License

MIT - Copyright 2026 Chocolatsuisse74
