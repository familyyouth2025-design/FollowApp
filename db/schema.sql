-- SAYET Admin Portal Database Schema
-- Run this file manually once to create all tables.
-- Never auto-run on app start. Schema changes go in /db/migrations/ as numbered files.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    cell VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin')),
    province VARCHAR(100),
    city VARCHAR(100),
    church VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    cell VARCHAR(20) NOT NULL UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')),
    age INTEGER CHECK (age > 0),
    birthday DATE,
    province VARCHAR(100),
    city VARCHAR(100),
    church VARCHAR(200),
    taskforce VARCHAR(50) CHECK (taskforce IN ('Economy', 'Protocol', 'Outreach', 'Worship & Arts')),
    age_range VARCHAR(20) CHECK (age_range IN ('Overcomers', 'Achievers')),
    whatsapp_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    start_dt TIMESTAMPTZ NOT NULL,
    end_dt TIMESTAMPTZ NOT NULL,
    address TEXT,
    province VARCHAR(100),
    city VARCHAR(100),
    flier_url VARCHAR(500),
    target_amount NUMERIC(12, 2) DEFAULT 0,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event files table
CREATE TABLE IF NOT EXISTS event_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, member_id)
);

-- Message campaigns table
CREATE TABLE IF NOT EXISTS message_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    audience_filter JSONB DEFAULT '{}',
    template TEXT NOT NULL,
    sent_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message log table
CREATE TABLE IF NOT EXISTS message_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES message_campaigns(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    cell VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'bounced', 'flagged')),
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Churches table
CREATE TABLE IF NOT EXISTS churches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL UNIQUE,
    province VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing church names into churches table (run once manually if needed)
-- INSERT INTO churches (name) SELECT DISTINCT church FROM members WHERE church IS NOT NULL AND church <> '' ON CONFLICT (name) DO NOTHING;

-- Saved message templates
CREATE TABLE IF NOT EXISTS saved_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    template TEXT NOT NULL,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_members_province ON members(province);
CREATE INDEX IF NOT EXISTS idx_members_taskforce ON members(taskforce);
CREATE INDEX IF NOT EXISTS idx_members_age_range ON members(age_range);
CREATE INDEX IF NOT EXISTS idx_members_whatsapp_valid ON members(whatsapp_valid);
CREATE INDEX IF NOT EXISTS idx_members_church ON members(church);
CREATE INDEX IF NOT EXISTS idx_contributions_event ON contributions(event_id);
CREATE INDEX IF NOT EXISTS idx_message_log_campaign ON message_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_event_files_event ON event_files(event_id);
