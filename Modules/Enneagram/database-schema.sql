-- Enneagram Module Database Schema
-- PostgreSQL Schema for LifeCraft Application

-- Core Enneagram types
CREATE TABLE enneagram_types (
    id SERIAL PRIMARY KEY,
    type_number INTEGER UNIQUE NOT NULL CHECK (type_number BETWEEN 1 AND 9),
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    core_motivation TEXT,
    core_fear TEXT,
    core_desire TEXT,
    key_motivations TEXT[],
    in_stress_moves_to INTEGER CHECK (in_stress_moves_to BETWEEN 1 AND 9),
    in_growth_moves_to INTEGER CHECK (in_growth_moves_to BETWEEN 1 AND 9),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enneagram wings
CREATE TABLE enneagram_wings (
    id SERIAL PRIMARY KEY,
    type_number INTEGER REFERENCES enneagram_types(type_number),
    wing_number INTEGER CHECK (wing_number BETWEEN 1 AND 9),
    description TEXT,
    characteristics TEXT[],
    UNIQUE(type_number, wing_number)
);

-- Enneagram subtypes (instinctual variants)
CREATE TABLE enneagram_subtypes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 'self-preservation', 'social', 'sexual'
    abbreviation VARCHAR(10),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment questions
CREATE TABLE enneagram_questions (
    id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50), -- 'core', 'wing', 'subtype'
    related_types INTEGER[],
    weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Enneagram assessments
CREATE TABLE user_enneagram_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responses JSONB NOT NULL,
    completion_status VARCHAR(20) DEFAULT 'in_progress',
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- User Enneagram profiles
CREATE TABLE user_enneagram_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    assessment_id INTEGER REFERENCES user_enneagram_assessments(id),
    primary_type INTEGER REFERENCES enneagram_types(type_number),
    primary_confidence DECIMAL(5,2),
    wing_type INTEGER CHECK (wing_type BETWEEN 1 AND 9),
    wing_confidence DECIMAL(5,2),
    subtype_id INTEGER REFERENCES enneagram_subtypes(id),
    tritype VARCHAR(10), -- e.g., "385"
    type_scores JSONB, -- scores for all 9 types
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, assessment_id)
);

-- Type relationships and dynamics
CREATE TABLE type_relationships (
    id SERIAL PRIMARY KEY,
    type1 INTEGER REFERENCES enneagram_types(type_number),
    type2 INTEGER REFERENCES enneagram_types(type_number),
    compatibility_score DECIMAL(3,2),
    strengths TEXT[],
    challenges TEXT[],
    growth_opportunities TEXT[],
    communication_tips TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type1, type2)
);

-- Growth levels (based on Riso-Hudson levels)
CREATE TABLE enneagram_levels (
    id SERIAL PRIMARY KEY,
    type_number INTEGER REFERENCES enneagram_types(type_number),
    level_number INTEGER CHECK (level_number BETWEEN 1 AND 9),
    level_name VARCHAR(100),
    description TEXT,
    behaviors TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User growth tracking
CREATE TABLE user_enneagram_growth (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type_number INTEGER REFERENCES enneagram_types(type_number),
    current_level INTEGER CHECK (current_level BETWEEN 1 AND 9),
    target_level INTEGER CHECK (target_level BETWEEN 1 AND 9),
    growth_areas TEXT[],
    action_items JSONB,
    progress_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enneagram insights
CREATE TABLE enneagram_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    insight_type VARCHAR(50), -- 'daily', 'growth', 'relationship', 'stress'
    content TEXT NOT NULL,
    related_type INTEGER REFERENCES enneagram_types(type_number),
    action_items JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Type-specific content
CREATE TABLE enneagram_content (
    id SERIAL PRIMARY KEY,
    type_number INTEGER REFERENCES enneagram_types(type_number),
    content_type VARCHAR(50), -- 'meditation', 'affirmation', 'exercise', 'reading'
    title VARCHAR(200),
    content TEXT,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_enneagram_profiles(user_id);
CREATE INDEX idx_user_assessments_user_id ON user_enneagram_assessments(user_id);
CREATE INDEX idx_user_growth_user_id ON user_enneagram_growth(user_id);
CREATE INDEX idx_insights_user_id ON enneagram_insights(user_id);
CREATE INDEX idx_type_relationships_types ON type_relationships(type1, type2);

-- Views for common queries
CREATE VIEW user_enneagram_summary AS
SELECT 
    uep.user_id,
    et.type_number,
    et.name as type_name,
    et.title as type_title,
    uep.wing_type,
    es.name as subtype_name,
    uep.primary_confidence,
    uep.updated_at
FROM user_enneagram_profiles uep
JOIN enneagram_types et ON uep.primary_type = et.type_number
LEFT JOIN enneagram_subtypes es ON uep.subtype_id = es.id
WHERE uep.assessment_id IN (
    SELECT MAX(id) FROM user_enneagram_assessments 
    GROUP BY user_id
);

-- Stored procedures
CREATE OR REPLACE FUNCTION get_type_compatibility(
    p_type1 INTEGER,
    p_type2 INTEGER
)
RETURNS TABLE (
    compatibility_score DECIMAL,
    strengths TEXT[],
    challenges TEXT[],
    growth_opportunities TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.compatibility_score,
        tr.strengths,
        tr.challenges,
        tr.growth_opportunities
    FROM type_relationships tr
    WHERE (tr.type1 = p_type1 AND tr.type2 = p_type2)
       OR (tr.type1 = p_type2 AND tr.type2 = p_type1)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate tritype
CREATE OR REPLACE FUNCTION calculate_tritype(
    p_type_scores JSONB
)
RETURNS VARCHAR AS $$
DECLARE
    heart_center INTEGER;
    head_center INTEGER;
    body_center INTEGER;
BEGIN
    -- Heart center (2, 3, 4)
    SELECT type::INTEGER INTO heart_center
    FROM jsonb_each_text(p_type_scores)
    WHERE type::INTEGER IN (2, 3, 4)
    ORDER BY value::DECIMAL DESC
    LIMIT 1;
    
    -- Head center (5, 6, 7)
    SELECT type::INTEGER INTO head_center
    FROM jsonb_each_text(p_type_scores)
    WHERE type::INTEGER IN (5, 6, 7)
    ORDER BY value::DECIMAL DESC
    LIMIT 1;
    
    -- Body center (8, 9, 1)
    SELECT type::INTEGER INTO body_center
    FROM jsonb_each_text(p_type_scores)
    WHERE type::INTEGER IN (8, 9, 1)
    ORDER BY value::DECIMAL DESC
    LIMIT 1;
    
    RETURN heart_center::VARCHAR || head_center::VARCHAR || body_center::VARCHAR;
END;
$$ LANGUAGE plpgsql;