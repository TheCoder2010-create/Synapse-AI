-- Medical Imaging Database Schema for Supabase
-- Run this SQL in your Supabase SQL editor to set up the database

-- Create the imaging_datasets table
CREATE TABLE IF NOT EXISTS imaging_datasets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    modality TEXT NOT NULL,
    body_part TEXT NOT NULL,
    disease_condition TEXT,
    dataset_size INTEGER DEFAULT 0,
    file_format TEXT NOT NULL,
    license TEXT NOT NULL,
    source_url TEXT NOT NULL,
    download_url TEXT,
    paper_reference TEXT,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_imaging_datasets_modality ON imaging_datasets(modality);
CREATE INDEX IF NOT EXISTS idx_imaging_datasets_body_part ON imaging_datasets(body_part);
CREATE INDEX IF NOT EXISTS idx_imaging_datasets_condition ON imaging_datasets(disease_condition);
CREATE INDEX IF NOT EXISTS idx_imaging_datasets_tags ON imaging_datasets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_imaging_datasets_metadata ON imaging_datasets USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_imaging_datasets_created_at ON imaging_datasets(created_at);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_imaging_datasets_search ON imaging_datasets USING GIN(
    to_tsvector('english', name || ' ' || description)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_imaging_datasets_updated_at 
    BEFORE UPDATE ON imaging_datasets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO imaging_datasets (
    name, 
    description, 
    modality, 
    body_part, 
    disease_condition, 
    dataset_size, 
    file_format, 
    license, 
    source_url, 
    tags, 
    metadata
) VALUES 
(
    'COVID-19 Chest X-ray Dataset',
    'Large dataset of chest X-rays from COVID-19 patients and healthy controls',
    'X-Ray',
    'Chest',
    'COVID-19',
    15000,
    'PNG',
    'CC BY 4.0',
    'https://github.com/ieee8023/covid-chestxray-dataset',
    ARRAY['covid-19', 'pneumonia', 'chest', 'x-ray'],
    '{"resolution": "1024x1024", "age_range": "18-90", "source": "NHS-X"}'::jsonb
),
(
    'Brain MRI Segmentation Dataset',
    'MRI brain scans with tumor segmentation masks',
    'MRI',
    'Brain',
    'Brain Tumor',
    3000,
    'NIfTI',
    'CC BY-NC 4.0',
    'https://www.med.upenn.edu/cbica/brats2020/',
    ARRAY['brain', 'tumor', 'segmentation', 'mri'],
    '{"slice_thickness": "1mm", "field_strength": "3T", "source": "NHS-X"}'::jsonb
),
(
    'Skin Lesion Classification Dataset',
    'Dermoscopic images of skin lesions for melanoma detection',
    'Dermoscopy',
    'Skin',
    'Melanoma',
    10000,
    'JPEG',
    'CC BY-NC 4.0',
    'https://www.isic-archive.com/',
    ARRAY['skin', 'melanoma', 'dermoscopy', 'classification'],
    '{"image_size": "600x450", "magnification": "10x", "source": "NHS-X"}'::jsonb
),
(
    'UK Biobank Brain MRI',
    'Large-scale brain MRI dataset from UK Biobank participants',
    'MRI',
    'Brain',
    NULL,
    50000,
    'NIfTI',
    'UK Biobank',
    'https://www.ukbiobank.ac.uk/',
    ARRAY['brain', 'mri', 'biobank', 'population'],
    '{"field_strength": "3T", "sequences": ["T1", "T2", "FLAIR"], "source": "NHS-X"}'::jsonb
),
(
    'MIMIC-CXR Chest X-rays',
    'Chest radiographs from MIMIC-III database with clinical reports',
    'X-Ray',
    'Chest',
    'Multiple',
    377110,
    'DICOM',
    'PhysioNet Credentialed Health Data License',
    'https://physionet.org/content/mimic-cxr/',
    ARRAY['chest', 'x-ray', 'mimic', 'clinical-reports'],
    '{"reports_included": true, "deidentified": true, "source": "NHS-X"}'::jsonb
);

-- Create view for dataset statistics
CREATE OR REPLACE VIEW dataset_stats AS
SELECT 
    COUNT(*) as total_datasets,
    SUM(dataset_size) as total_images,
    AVG(dataset_size) as avg_dataset_size,
    COUNT(DISTINCT modality) as unique_modalities,
    COUNT(DISTINCT body_part) as unique_body_parts,
    COUNT(DISTINCT disease_condition) as unique_conditions
FROM imaging_datasets;

-- Create view for modality breakdown
CREATE OR REPLACE VIEW modality_stats AS
SELECT 
    modality,
    COUNT(*) as dataset_count,
    SUM(dataset_size) as total_images,
    AVG(dataset_size) as avg_images_per_dataset
FROM imaging_datasets
GROUP BY modality
ORDER BY dataset_count DESC;

-- Create view for body part breakdown
CREATE OR REPLACE VIEW body_part_stats AS
SELECT 
    body_part,
    COUNT(*) as dataset_count,
    SUM(dataset_size) as total_images,
    COUNT(DISTINCT modality) as modalities_used
FROM imaging_datasets
GROUP BY body_part
ORDER BY dataset_count DESC;

-- Create view for condition breakdown
CREATE OR REPLACE VIEW condition_stats AS
SELECT 
    disease_condition,
    COUNT(*) as dataset_count,
    SUM(dataset_size) as total_images,
    COUNT(DISTINCT modality) as modalities_used
FROM imaging_datasets
WHERE disease_condition IS NOT NULL
GROUP BY disease_condition
ORDER BY dataset_count DESC;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE imaging_datasets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY "Allow read access to all users" ON imaging_datasets
    FOR SELECT USING (true);

-- Create policy to allow insert/update for authenticated users
CREATE POLICY "Allow insert for authenticated users" ON imaging_datasets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON imaging_datasets
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT ON imaging_datasets TO anon;
GRANT SELECT ON imaging_datasets TO authenticated;
GRANT INSERT, UPDATE ON imaging_datasets TO authenticated;

-- Grant access to views
GRANT SELECT ON dataset_stats TO anon, authenticated;
GRANT SELECT ON modality_stats TO anon, authenticated;
GRANT SELECT ON body_part_stats TO anon, authenticated;
GRANT SELECT ON condition_stats TO anon, authenticated;

-- Create AI diagnoses table
CREATE TABLE IF NOT EXISTS ai_diagnoses (
    id TEXT PRIMARY KEY,
    findings TEXT[] DEFAULT '{}',
    impression TEXT NOT NULL,
    recommendations TEXT[] DEFAULT '{}',
    confidence DECIMAL(3,2) DEFAULT 0.0,
    urgency TEXT CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Low',
    follow_up TEXT,
    report_text TEXT NOT NULL,
    patient_id TEXT,
    image_url TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for AI diagnoses
CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_patient_id ON ai_diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_status ON ai_diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_urgency ON ai_diagnoses(urgency);
CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_created_at ON ai_diagnoses(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_metadata ON ai_diagnoses USING GIN(metadata);

-- Create trigger for ai_diagnoses updated_at
CREATE TRIGGER update_ai_diagnoses_updated_at 
    BEFORE UPDATE ON ai_diagnoses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for ai_diagnoses
ALTER TABLE ai_diagnoses ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_diagnoses
CREATE POLICY "Allow read access to ai_diagnoses" ON ai_diagnoses
    FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users on ai_diagnoses" ON ai_diagnoses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users on ai_diagnoses" ON ai_diagnoses
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions for ai_diagnoses
GRANT SELECT ON ai_diagnoses TO anon;
GRANT SELECT ON ai_diagnoses TO authenticated;
GRANT INSERT, UPDATE ON ai_diagnoses TO authenticated;

-- Create view for diagnosis statistics
CREATE OR REPLACE VIEW diagnosis_stats AS
SELECT 
    COUNT(*) as total_diagnoses,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_diagnoses,
    COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_diagnoses,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_diagnoses,
    COUNT(CASE WHEN urgency = 'Critical' THEN 1 END) as critical_cases,
    COUNT(CASE WHEN urgency = 'High' THEN 1 END) as high_urgency_cases,
    AVG(confidence) as avg_confidence,
    COUNT(DISTINCT patient_id) as unique_patients
FROM ai_diagnoses;

-- Grant access to diagnosis stats view
GRANT SELECT ON diagnosis_stats TO anon, authenticated;