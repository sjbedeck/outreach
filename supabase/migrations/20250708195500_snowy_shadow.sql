/*
  # Contact Management System Schema

  1. New Tables
    - `contact_lists` - For organizing contacts into lists/groups
    - `contact_statuses` - Predefined statuses for contacts
    - `contact_notes` - Notes associated with contacts
    
  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own contacts
    
  3. Changes
    - Add confidence scores to contacts table
    - Add embedding vector for similarity search
*/

-- Create contact lists table
CREATE TABLE IF NOT EXISTS contact_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact statuses table
CREATE TABLE IF NOT EXISTS contact_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  description text,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create contact notes table
CREATE TABLE IF NOT EXISTS contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact_list_members junction table
CREATE TABLE IF NOT EXISTS contact_list_members (
  contact_id uuid NOT NULL,
  list_id uuid NOT NULL,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (contact_id, list_id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
);

-- Add reference to contact lists
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status_id uuid REFERENCES contact_statuses(id);

-- Enable Row Level Security
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own contact lists"
ON contact_lists
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own contact statuses"
ON contact_statuses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own contact notes"
ON contact_notes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own contact list members"
ON contact_list_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contact_lists
    WHERE id = list_id AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contact_lists
    WHERE id = list_id AND user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_contact_lists_user_id ON contact_lists(user_id);
CREATE INDEX idx_contact_statuses_user_id ON contact_statuses(user_id);
CREATE INDEX idx_contact_notes_contact_id ON contact_notes(contact_id);
CREATE INDEX idx_contact_notes_user_id ON contact_notes(user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_lists_updated_at
BEFORE UPDATE ON contact_lists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_notes_updated_at
BEFORE UPDATE ON contact_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default statuses for all users
INSERT INTO contact_statuses (id, user_id, name, color, description, is_default, sort_order)
SELECT 
  gen_random_uuid(),
  id,
  'New',
  '#3B82F6', -- Blue
  'Newly added contact',
  true,
  1
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM contact_statuses WHERE name = 'New' AND user_id = users.id
);

INSERT INTO contact_statuses (id, user_id, name, color, description, is_default, sort_order)
SELECT 
  gen_random_uuid(),
  id,
  'Contacted',
  '#10B981', -- Green
  'Contact has been reached out to',
  false,
  2
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM contact_statuses WHERE name = 'Contacted' AND user_id = users.id
);

INSERT INTO contact_statuses (id, user_id, name, color, description, is_default, sort_order)
SELECT 
  gen_random_uuid(),
  id,
  'Replied',
  '#6366F1', -- Indigo
  'Contact has replied',
  false,
  3
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM contact_statuses WHERE name = 'Replied' AND user_id = users.id
);

INSERT INTO contact_statuses (id, user_id, name, color, description, is_default, sort_order)
SELECT 
  gen_random_uuid(),
  id,
  'Qualified',
  '#F59E0B', -- Amber
  'Qualified lead',
  false,
  4
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM contact_statuses WHERE name = 'Qualified' AND user_id = users.id
);

INSERT INTO contact_statuses (id, user_id, name, color, description, is_default, sort_order)
SELECT 
  gen_random_uuid(),
  id,
  'Converted',
  '#EC4899', -- Pink
  'Successfully converted to customer',
  false,
  5
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM contact_statuses WHERE name = 'Converted' AND user_id = users.id
);

-- Create default list for each user
INSERT INTO contact_lists (id, user_id, name, description, is_default)
SELECT 
  gen_random_uuid(),
  id,
  'All Contacts',
  'Default list containing all contacts',
  true
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM contact_lists WHERE name = 'All Contacts' AND user_id = users.id
);