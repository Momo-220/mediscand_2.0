-- Schema SQL pour MediScan avec Supabase
-- Ce fichier contient la structure de la base de données PostgreSQL

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs (étend les données auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des analyses de médicaments
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  details_analyse JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_nom ON analyses USING gin(to_tsvector('french', nom));

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at 
  BEFORE UPDATE ON analyses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Règles de sécurité (Row Level Security)

-- Activer RLS sur les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Politiques pour la table analyses
CREATE POLICY "Les utilisateurs peuvent voir leurs propres analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres analyses" ON analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres analyses" ON analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour le stockage
-- Ces politiques doivent être configurées dans le dashboard Supabase pour le Storage

-- Fonction pour obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_analyses', COUNT(*),
    'latest_analysis', MAX(created_at),
    'first_analysis', MIN(created_at)
  ) INTO stats
  FROM analyses
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(stats, '{"total_analyses": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rechercher des analyses par nom de médicament
CREATE OR REPLACE FUNCTION search_analyses(search_term TEXT, user_uuid UUID)
RETURNS SETOF analyses AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM analyses
  WHERE user_id = user_uuid
  AND (
    nom ILIKE '%' || search_term || '%'
    OR description ILIKE '%' || search_term || '%'
    OR details_analyse::text ILIKE '%' || search_term || '%'
  )
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires sur les tables
COMMENT ON TABLE profiles IS 'Profils utilisateurs étendant les données auth.users';
COMMENT ON TABLE analyses IS 'Analyses de médicaments effectuées par les utilisateurs';

COMMENT ON COLUMN analyses.details_analyse IS 'Détails complets de l''analyse au format JSON';
COMMENT ON COLUMN analyses.image_url IS 'URL de l''image du médicament stockée dans Supabase Storage';
