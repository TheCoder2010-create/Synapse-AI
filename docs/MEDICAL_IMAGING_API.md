# Medical Imaging API Documentation

This API provides access to medical imaging datasets based on the NHS-X open source imaging data repository. It supports dataset discovery, search, statistics, and management operations.

## Database Setup

### Option 1: Supabase (Recommended)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to your `.env.local` file
3. Run the SQL setup script in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of scripts/setup-supabase.sql
   ```

### Option 2: PostgreSQL

1. Install PostgreSQL locally or use a cloud provider
2. Create a new database named `medical_imaging`
3. Run the setup script:
   ```bash
   psql -d medical_imaging -f scripts/setup-supabase.sql
   ```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
AI_DIAGNOSIS_ENABLED=true
```

## API Endpoints

### 1. Get All Datasets

**GET** `/api/medical-imaging/datasets`

Retrieve all medical imaging datasets with optional filtering.

**Query Parameters:**
- `modality` (optional): Filter by imaging modality (CT, MRI, X-Ray, etc.)
- `body_part` (optional): Filter by body part (Brain, Chest, etc.)
- `condition` (optional): Filter by medical condition
- `limit` (optional): Limit number of results (default: all)
- `offset` (optional): Offset for pagination (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/medical-imaging/datasets?modality=MRI&body_part=Brain&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Brain MRI Segmentation Dataset",
      "description": "MRI brain scans with tumor segmentation masks",
      "modality": "MRI",
      "body_part": "Brain",
      "disease_condition": "Brain Tumor",
      "dataset_size": 3000,
      "file_format": "NIfTI",
      "license": "CC BY-NC 4.0",
      "source_url": "https://example.com",
      "tags": ["brain", "tumor", "segmentation", "mri"],
      "metadata": {
        "slice_thickness": "1mm",
        "field_strength": "3T"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1,
  "filters": {
    "modality": "MRI",
    "body_part": "Brain"
  }
}
```

### 2. Get Dataset by ID

**GET** `/api/medical-imaging/datasets/[id]`

Retrieve a specific dataset by its ID.

**Example:**
```bash
curl "http://localhost:3000/api/medical-imaging/datasets/uuid-here"
```

### 3. Search Datasets

**GET** `/api/medical-imaging/search`

Search datasets by name, description, or tags.

**Query Parameters:**
- `q` (required): Search query
- `modality` (optional): Filter by modality
- `body_part` (optional): Filter by body part

**Example:**
```bash
curl "http://localhost:3000/api/medical-imaging/search?q=covid&modality=X-Ray"
```

### 4. Get Statistics

**GET** `/api/medical-imaging/stats`

Get comprehensive statistics about the dataset collection.

**Example:**
```bash
curl "http://localhost:3000/api/medical-imaging/stats"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_datasets": 25,
    "by_modality": {
      "MRI": 8,
      "CT": 6,
      "X-Ray": 7,
      "Ultrasound": 4
    },
    "by_body_part": {
      "Brain": 10,
      "Chest": 8,
      "Abdomen": 4,
      "Other": 3
    },
    "by_condition": {
      "Cancer": 12,
      "COVID-19": 5,
      "Alzheimer's": 3
    },
    "total_images": 150000,
    "avg_dataset_size": 6000
  }
}
```

### 5. Add New Dataset

**POST** `/api/medical-imaging/datasets`

Add a new dataset to the collection.

**Required Fields:**
- `name`: Dataset name
- `description`: Dataset description
- `modality`: Imaging modality
- `body_part`: Body part imaged
- `dataset_size`: Number of images
- `file_format`: File format (DICOM, NIfTI, etc.)
- `license`: License information
- `source_url`: Source URL

**Optional Fields:**
- `disease_condition`: Medical condition
- `download_url`: Direct download URL
- `paper_reference`: Academic paper reference
- `tags`: Array of tags
- `metadata`: Additional metadata object

**Example:**
```bash
curl -X POST "http://localhost:3000/api/medical-imaging/datasets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Dataset",
    "description": "Description here",
    "modality": "CT",
    "body_part": "Chest",
    "dataset_size": 1000,
    "file_format": "DICOM",
    "license": "CC BY 4.0",
    "source_url": "https://example.com"
  }'
```

### 6. Sync NHS-X Data

**POST** `/api/medical-imaging/sync`

Synchronize data from the NHS-X repository.

**Example:**
```bash
curl -X POST "http://localhost:3000/api/medical-imaging/sync"
```

## AI Diagnosis Endpoints

### 7. AI Medical Image Analysis

**POST** `/api/medical-imaging/diagnose`

Analyze a medical image using Google Gemini AI and generate a comprehensive diagnosis report.

**Required Fields:**
- `imageData`: Base64 encoded image data
- `imageType`: MIME type (image/jpeg, image/png, image/webp)
- `modality`: Imaging modality (X-Ray, CT, MRI, etc.)
- `bodyPart`: Body part being imaged

**Optional Fields:**
- `patientAge`: Patient age in years
- `patientSex`: Patient sex (M, F, Other)
- `clinicalHistory`: Clinical history and context
- `symptoms`: Array of presenting symptoms

**Example:**
```bash
curl -X POST "http://localhost:3000/api/medical-imaging/diagnose" \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "base64_encoded_image_data_here",
    "imageType": "image/jpeg",
    "modality": "X-Ray",
    "bodyPart": "Chest",
    "patientAge": 45,
    "patientSex": "F",
    "clinicalHistory": "Patient presents with chest pain and shortness of breath",
    "symptoms": ["chest pain", "shortness of breath", "cough"]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "diag_1234567890_abc123def",
    "findings": [
      "Normal cardiac silhouette",
      "Clear lung fields bilaterally",
      "No acute cardiopulmonary abnormalities"
    ],
    "impression": "Normal chest radiograph",
    "recommendations": [
      "Clinical correlation recommended",
      "Consider ECG if chest pain persists"
    ],
    "confidence": 0.85,
    "urgency": "Low",
    "followUp": "Routine follow-up as clinically indicated",
    "reportText": "Full detailed report text...",
    "createdAt": "2024-01-01T12:00:00Z",
    "metadata": {
      "modality": "X-Ray",
      "bodyPart": "Chest",
      "processingTime": 3500,
      "model": "gemini-1.5-pro-vision"
    }
  }
}
```

### 8. Get Supported Analysis Types

**GET** `/api/medical-imaging/diagnose`

Get information about supported modalities, body parts, and image formats.

**Example:**
```bash
curl "http://localhost:3000/api/medical-imaging/diagnose"
```

### 9. Get Diagnosis Statistics

**GET** `/api/medical-imaging/diagnoses`

Get comprehensive statistics about AI diagnoses.

**Example:**
```bash
curl "http://localhost:3000/api/medical-imaging/diagnoses"
```

### 10. Get Patient Diagnoses

**GET** `/api/medical-imaging/diagnoses?patient_id=xxx`

Get all diagnoses for a specific patient.

**Example:**
```bash
curl "http://localhost:3000/api/medical-imaging/diagnoses?patient_id=patient123"
```

### 11. Get Specific Diagnosis

**GET** `/api/medical-imaging/diagnoses/[id]`

Retrieve a specific diagnosis by ID.

**Example:**
```bash
curl "http://localhost:3000/api/medical-imaging/diagnoses/diag_1234567890_abc123def"
```

### 12. Update Diagnosis Status

**PATCH** `/api/medical-imaging/diagnoses/[id]`

Update the review status of a diagnosis.

**Request Body:**
- `status`: New status (pending, reviewed, approved, rejected)
- `reviewedBy`: (optional) ID of the reviewing physician

**Example:**
```bash
curl -X PATCH "http://localhost:3000/api/medical-imaging/diagnoses/diag_1234567890_abc123def" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reviewedBy": "dr_smith_123"
  }'
```

## Data Model

### ImagingDataset Interface

```typescript
interface ImagingDataset {
  id: string;
  name: string;
  description: string;
  modality: string; // CT, MRI, X-Ray, Ultrasound, etc.
  body_part: string;
  disease_condition?: string;
  dataset_size: number;
  file_format: string; // DICOM, NIfTI, PNG, etc.
  license: string;
  source_url: string;
  download_url?: string;
  paper_reference?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  metadata: Record<string, any>;
}
```

## Supported Modalities

- **CT**: Computed Tomography
- **MRI**: Magnetic Resonance Imaging
- **X-Ray**: Radiography
- **Ultrasound**: Ultrasonography
- **PET**: Positron Emission Tomography
- **Mammography**: Breast imaging
- **Endoscopy**: Internal imaging
- **Dermoscopy**: Skin imaging
- **Fundus**: Retinal imaging
- **OCT**: Optical Coherence Tomography

## Supported Body Parts

- Brain
- Chest
- Heart
- Abdomen
- Spine
- Breast
- Skin
- Eye
- Bone
- Pelvis
- Other

## Usage Examples

### JavaScript/TypeScript

```typescript
// Fetch all MRI datasets
const response = await fetch('/api/medical-imaging/datasets?modality=MRI');
const data = await response.json();

// Search for COVID datasets
const searchResponse = await fetch('/api/medical-imaging/search?q=covid');
const searchData = await searchResponse.json();

// Get statistics
const statsResponse = await fetch('/api/medical-imaging/stats');
const stats = await statsResponse.json();

// AI Diagnosis Example
async function diagnoseMedicalImage(imageFile: File, modality: string, bodyPart: string) {
  // Convert image to base64
  const base64 = await fileToBase64(imageFile);
  
  const response = await fetch('/api/medical-imaging/diagnose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: base64,
      imageType: imageFile.type,
      modality,
      bodyPart,
      patientAge: 45,
      symptoms: ['chest pain', 'shortness of breath']
    }),
  });
  
  const diagnosis = await response.json();
  return diagnosis.data;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      resolve(base64.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
}
```

### Python

```python
import requests

# Get all datasets
response = requests.get('http://localhost:3000/api/medical-imaging/datasets')
datasets = response.json()

# Search datasets
search_response = requests.get(
    'http://localhost:3000/api/medical-imaging/search',
    params={'q': 'brain tumor', 'modality': 'MRI'}
)
results = search_response.json()
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message here",
  "status": 400
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created (for POST requests)
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended to implement it for production use.

## Authentication

The API currently supports anonymous read access. For write operations, implement authentication as needed for your use case.

## Contributing

To add support for new data sources:

1. Create a new scraper service in `services/`
2. Implement the data conversion logic
3. Add new API endpoints if needed
4. Update the database schema if required

## License

This API is designed to work with open source medical imaging datasets. Please respect the individual licenses of each dataset.