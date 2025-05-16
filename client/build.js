const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}Starting custom build process...${colors.reset}`);

// Step 1: Install dependencies with legacy-peer-deps
console.log(`${colors.yellow}Installing dependencies...${colors.reset}`);
try {
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log(`${colors.green}Dependencies installed successfully!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Failed to install dependencies:${colors.reset}`, error);
  process.exit(1);
}

// Step 2: Explicitly install Tailwind CSS and related packages
console.log(`${colors.yellow}Installing Tailwind CSS and related packages...${colors.reset}`);
try {
  execSync('npm install tailwindcss@3.2.7 postcss@8.4.21 autoprefixer@10.4.14 --no-save --legacy-peer-deps', { stdio: 'inherit' });
  console.log(`${colors.green}Tailwind CSS installed successfully!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Failed to install Tailwind CSS:${colors.reset}`, error);
  process.exit(1);
}

// Step 3: Verify that Tailwind CSS is installed
console.log(`${colors.yellow}Verifying Tailwind CSS installation...${colors.reset}`);
try {
  const tailwindPath = path.resolve('./node_modules/tailwindcss');
  if (fs.existsSync(tailwindPath)) {
    console.log(`${colors.green}Tailwind CSS verified at ${tailwindPath}${colors.reset}`);
  } else {
    throw new Error('Tailwind CSS not found in node_modules');
  }
} catch (error) {
  console.error(`${colors.red}Tailwind CSS verification failed:${colors.reset}`, error);
  process.exit(1);
}

// Step 4: Run Next.js build
console.log(`${colors.yellow}Building Next.js application...${colors.reset}`);
try {
  execSync('next build', { stdio: 'inherit' });
  console.log(`${colors.green}Next.js build completed successfully!${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Next.js build failed:${colors.reset}`, error);
  process.exit(1);
}

console.log(`${colors.blue}Custom build process completed!${colors.reset}`);
