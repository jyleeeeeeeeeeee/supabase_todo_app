/*
# Create categories and todos tables (multi-user, owner-scoped)

1. Overview
   Adds the two data tables for the Todo app: `categories` (user-defined groups)
   and `todos` (tasks that optionally belong to a category). Each row is owned
   by the authenticated user who created it, and RLS restricts every row to its
   owner. A todo whose category is deleted falls back to "no category" because
   the foreign key uses ON DELETE SET NULL.

2. New Tables

   categories
   - id          (int8 / bigint identity, primary key)
   - user_id     (uuid, not null, defaults to auth.uid(), references auth.users ON DELETE CASCADE)
   - name        (text, not null)
   - created_at  (timestamptz, defaults to now())

   todos
   - id          (int8 / bigint identity, primary key)
   - created_at  (timestamptz, defaults to now())
   - title       (text, not null)
   - is_done     (boolean, not null, defaults to false)
   - user_id     (uuid, not null, defaults to auth.uid(), references auth.users ON DELETE CASCADE)
   - category_id (int8, nullable, references categories(id) ON DELETE SET NULL)

3. Indexes
   - categories(user_id)  — filter a user's categories
   - todos(user_id)       — filter a user's todos

4. Security (RLS)
   - Enable RLS on both tables.
   - categories: owner-scoped CRUD for authenticated users (auth.uid() = user_id).
   - todos: owner-scoped CRUD for authenticated users (auth.uid() = user_id).

5. Notes
   - user_id columns default to auth.uid() so client inserts that omit user_id
     still satisfy the INSERT WITH CHECK policy.
   - Four separate policies per table (select/insert/update/delete); no FOR ALL.
   - category_id uses ON DELETE SET NULL so todos survive category deletion.
*/

CREATE TABLE IF NOT EXISTS categories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id bigint REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
CREATE INDEX IF NOT EXISTS todos_user_id_idx ON todos(user_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- categories policies
DROP POLICY IF EXISTS "select_own_categories" ON categories;
CREATE POLICY "select_own_categories" ON categories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_categories" ON categories;
CREATE POLICY "insert_own_categories" ON categories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_categories" ON categories;
CREATE POLICY "update_own_categories" ON categories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_categories" ON categories;
CREATE POLICY "delete_own_categories" ON categories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- todos policies
DROP POLICY IF EXISTS "select_own_todos" ON todos;
CREATE POLICY "select_own_todos" ON todos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_todos" ON todos;
CREATE POLICY "insert_own_todos" ON todos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_todos" ON todos;
CREATE POLICY "update_own_todos" ON todos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_todos" ON todos;
CREATE POLICY "delete_own_todos" ON todos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
