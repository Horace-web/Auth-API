// Script de test pour vérifier la configuration Google OAuth
import 'dotenv/config';

console.log('🔍 Vérification de la configuration Google OAuth...\n');

const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'FRONTEND_URL',
  'DATABASE_URL'
];

let allPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' : value}`);
  } else {
    console.log(`❌ ${varName}: MANQUANT`);
    allPresent = false;
  }
});

console.log('\n📋 Résumé:');
if (allPresent) {
  console.log('✅ Toutes les variables d\'environnement sont configurées');
  console.log('\n🚀 Prochaines étapes:');
  console.log('1. Vérifiez que les identifiants Google sont corrects');
  console.log('2. Démarrez le serveur: npm run dev');
  console.log('3. Testez dans le navigateur: http://localhost:3000/api/auth/google');
} else {
  console.log('❌ Certaines variables d\'environnement manquent');
  console.log('\n📝 Créez ou mettez à jour le fichier .env avec toutes les variables requises');
}

// Vérifier les packages
console.log('\n📦 Vérification des packages...');
try {
  const passport = await import('passport');
  console.log('✅ passport: installé');
} catch (e) {
  console.log('❌ passport: NON INSTALLÉ - exécutez: npm install');
}

try {
  const passportGoogle = await import('passport-google-oauth20');
  console.log('✅ passport-google-oauth20: installé');
} catch (e) {
  console.log('❌ passport-google-oauth20: NON INSTALLÉ - exécutez: npm install');
}

console.log('\n✨ Test terminé!');

