// Script pour créer le bucket de stockage Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Utilisez la clé service role

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('Ajoutez dans votre .env.local :');
  console.log('NEXT_PUBLIC_SUPABASE_URL=votre-url-supabase');
  console.log('SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  try {
    console.log('🔄 Création du bucket medicament-images...');
    
    // Créer le bucket
    const { data, error } = await supabase.storage.createBucket('medicament-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Le bucket medicament-images existe déjà');
        return;
      }
      throw error;
    }

    console.log('✅ Bucket medicament-images créé avec succès');
    
    // Configurer les politiques de sécurité
    console.log('🔄 Configuration des politiques de sécurité...');
    
    const policies = [
      {
        name: 'Authenticated users can upload images',
        policy: `auth.uid()::text = (storage.foldername(name))[1]`,
        operation: 'INSERT'
      },
      {
        name: 'Public can view images',
        policy: `bucket_id = 'medicament-images'`,
        operation: 'SELECT'
      },
      {
        name: 'Users can delete their own images',
        policy: `auth.uid()::text = (storage.foldername(name))[1]`,
        operation: 'DELETE'
      }
    ];

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('create_storage_policy', {
        bucket_name: 'medicament-images',
        policy_name: policy.name,
        policy: policy.policy,
        operation: policy.operation
      });

      if (policyError && !policyError.message.includes('already exists')) {
        console.warn(`⚠️ Erreur lors de la création de la politique ${policy.name}:`, policyError.message);
      } else {
        console.log(`✅ Politique ${policy.name} configurée`);
      }
    }

    console.log('🎉 Configuration du stockage terminée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du bucket:', error);
  }
}

createStorageBucket();



