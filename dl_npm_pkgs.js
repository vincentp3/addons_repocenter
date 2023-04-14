const fs = require('fs');
const { execSync } = require('child_process');

const packageLock = JSON.parse(fs.readFileSync('npm-shrinkwrap.json', 'utf8'));

function getLatestVersion(name) {
  try {
    const output = execSync(`npm view ${name} version`, { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    console.error(`Erreur lors de la récupération de la dernière version de ${name}:`, error.message);
    return 'latest';
  }
}

function downloadPackage(name, version) {
  const packageName = `${name}@${version}`;
  console.log(`Downloading ${packageName}`);
  execSync(`npm pack ${packageName}`, { stdio: 'inherit' });
}

function processDep(deps) {
  for (const key in deps) {
    let value = deps[key];
    let version = value;
    if (version.includes('^')) {
      version = getLatestVersion(key);
    }
    downloadPackage(key, version);
  }
}

function processDependencies(deps) {
  for (const [name, info] of Object.entries(deps)) {
    console.log('Traitement de ', name, info);
    if (name === '') {
      continue; // Ignore root project
    }
    let short_name = name;
    if (name.includes('/')) {
      const parts = name.split('/');
      const short_name_parts = parts.slice(1);
      short_name = short_name_parts.join('/');
      if (short_name.includes('node_modules/')) {
        parts = short_name.split('node_modules/');
        short_name = parts[parts.length - 1];
        console.log('short_name = ', short_name);
      }
    }

    downloadPackage(short_name, info.version);
    if (info.dependencies) {
      processDep(info.dependencies);
    }
  }
}

console.log(packageLock);
processDependencies(packageLock.packages);
