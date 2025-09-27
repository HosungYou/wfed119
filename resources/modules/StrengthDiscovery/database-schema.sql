-- Strength Discovery Module Database Schema
-- PostgreSQL Schema for LifeCraft Application

-- Strength categories and types
CREATE TABLE strength_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES strength_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual strengths catalog
CREATE TABLE strengths (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES strength_categories(id),
    assessment_weight DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment templates
CREATE TABLE assessment_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    scoring_algorithm VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User strength assessments
CREATE TABLE user_assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL, -- References main user table
    template_id INTEGER REFERENCES assessment_templates(id),
    responses JSONB NOT NULL,
    completion_status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User identified strengths
CREATE TABLE user_strengths (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    strength_id INTEGER REFERENCES strengths(id),
    assessment_id INTEGER REFERENCES user_assessments(id),
    score DECIMAL(5,2),
    confidence_level DECIMAL(3,2),
    rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, strength_id, assessment_id)
);

-- Strength development goals
CREATE TABLE strength_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    strength_id INTEGER REFERENCES strengths(id),
    goal_description TEXT,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    progress DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strength insights and recommendations
CREATE TABLE strength_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    insight_type VARCHAR(50),
    content TEXT NOT NULL,
    related_strengths INTEGER[],
    action_items JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strength development activities
CREATE TABLE strength_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    strength_id INTEGER REFERENCES strengths(id),
    activity_type VARCHAR(50),
    description TEXT,
    duration_minutes INTEGER,
    reflection TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_strengths_user_id ON user_strengths(user_id);
CREATE INDEX idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX idx_strength_goals_user_id ON strength_goals(user_id);
CREATE INDEX idx_strength_insights_user_id ON strength_insights(user_id);
CREATE INDEX idx_strength_activities_user_id ON strength_activities(user_id);

-- Views for common queries
CREATE VIEW user_strength_profile AS
SELECT 
    us.user_id,
    s.name as strength_name,
    sc.name as category_name,
    us.score,
    us.rank,
    us.confidence_level,
    us.updated_at
FROM user_strengths us
JOIN strengths s ON us.strength_id = s.id
JOIN strength_categories sc ON s.category_id = sc.id
WHERE us.assessment_id IN (
    SELECT MAX(id) FROM user_assessments 
    GROUP BY user_id
);

-- Stored procedures for data retrieval patterns
CREATE OR REPLACE FUNCTION get_user_top_strengths(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    strength_name VARCHAR,
    category_name VARCHAR,
    score DECIMAL,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name,
        sc.name,
        us.score,
        us.rank
    FROM user_strengths us
    JOIN strengths s ON us.strength_id = s.id
    JOIN strength_categories sc ON s.category_id = sc.id
    WHERE us.user_id = p_user_id
        AND us.assessment_id = (
            SELECT MAX(id) FROM user_assessments 
            WHERE user_id = p_user_id
        )
    ORDER BY us.rank
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;