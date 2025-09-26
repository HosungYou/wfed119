#!/usr/bin/env node

/**
 * Setup environment variables from GitHub secrets or manual input
 * Usage: node scripts/setup-env-from-secrets.js
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envTemplate = {
  // AI APIs
  OPENAI_API_KEY: {
    description: 'OpenAI API Key (optional - for AI features)',
    required: false,
    default: ''
  },
  ANTHROPIC_API_KEY: {
    description: 'Anthropic API Key (optional - for AI features)',
    required: false,
    default: ''
  },

  // Database
  DATABASE_URL: {
    description: 'Database URL (Prisma Accelerate recommended)',
    required: true,
    default: 'file:./dev.db',
    options: [
      'Prisma Accelerate (shared production DB)',
      'Local PostgreSQL',
      'SQLite (development only)'
    ]
  },

  // Google OAuth
  GOOGLE_CLIENT_ID: {
    description: 'Google OAuth Client ID (for authentication)',
    required: false,
    default: ''
  },
  GOOGLE_CLIENT_SECRET: {
    description: 'Google OAuth Client Secret (for authentication)',
    required: false,
    default: ''
  },

  // Configuration
  AI_PRIMARY_SERVICE: {
    description: 'Primary AI service',
    required: false,
    default: 'anthropic'
  },
  AI_FALLBACK_SERVICE: {
    description: 'Fallback AI service',
    required: false,
    default: 'openai'
  },
  NEXTAUTH_SECRET: {
    description: 'NextAuth secret (generate random string)',
    required: false,
    default: () => require('crypto').randomBytes(32).toString('hex')
  }
};

async function promptUser(key, config) {
  return new Promise((resolve) => {
    const defaultValue = typeof config.default === 'function' ? config.default() : config.default;
    const required = config.required ? ' (REQUIRED)' : ' (optional)';

    let prompt = `${key}${required}: ${config.description}`;
    if (defaultValue) {
      prompt += ` [default: ${defaultValue}]`;
    }
    if (config.options) {
      prompt += `\nOptions:\n${config.options.map((opt, i) => `  ${i + 1}. ${opt}`).join('\n')}`;
    }
    prompt += '\nValue: ';

    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function setupEnvironment() {
  console.log('🔧 WFED119 Environment Setup');
  console.log('==============================\n');

  const envPath = path.join(process.cwd(), '.env');

  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists');
    const overwrite = await new Promise((resolve) => {
      rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });

    if (!overwrite) {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('📝 Please provide the following environment variables:\n');

  const envVars = {};

  for (const [key, config] of Object.entries(envTemplate)) {
    envVars[key] = await promptUser(key, config);
  }

  // Handle database URL options
  if (envVars.DATABASE_URL === '1' || envVars.DATABASE_URL.toLowerCase().includes('prisma')) {
    console.log('\n🔗 For Prisma Accelerate, contact project owner for API key');
    envVars.DATABASE_URL = 'prisma+postgres://accelerate.prisma-data.net/?api_key=YOUR_API_KEY_HERE';
  } else if (envVars.DATABASE_URL === '2' || envVars.DATABASE_URL.toLowerCase().includes('postgres')) {
    envVars.DATABASE_URL = 'postgresql://admin:password@localhost:5432/wfed119_dev';
  } else if (envVars.DATABASE_URL === '3' || envVars.DATABASE_URL.toLowerCase().includes('sqlite')) {
    envVars.DATABASE_URL = 'file:./dev.db';
  }

  // Generate .env file
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envFileContent = `# WFED119 Environment Variables
# Generated: ${new Date().toISOString()}

${envContent}

# Additional configuration
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
ENABLE_AI_ANALYSIS=true
ENABLE_TIE_BREAKERS=true
ENABLE_REALTIME_FEEDBACK=true
NEXT_PUBLIC_ENABLE_REALTIME_FEEDBACK=true
`;

  fs.writeFileSync(envPath, envFileContent);

  console.log('\n✅ Environment setup completed!');
  console.log(`📄 .env file created at: ${envPath}`);

  if (envVars.DATABASE_URL.includes('YOUR_API_KEY_HERE')) {
    console.log('\n⚠️  Don\'t forget to update DATABASE_URL with actual Prisma Accelerate API key');
  }

  console.log('\n🚀 Next steps:');
  console.log('1. npm install');
  console.log('2. npm run dev');
  console.log('3. Contact project owner for any missing API keys');

  rl.close();
}

setupEnvironment().catch(console.error);