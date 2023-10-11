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

function getLatestVersionWithinMajor(name, major, fallbackVersion) {
  try {
    const output = execSync(`npm view ${name} versions --json`, { encoding: 'utf8' });
    const versions = JSON.parse(output);
    const filteredVersions = versions.filter(version => version.startsWith(`${major}.`));
    return filteredVersions.pop();
  } catch (error) {
    console.error(`Erreur lors de la récupération de la dernière version de ${name} avec la version majeure ${major}:`, error.message);
    return fallbackVersion;
  }
}

function downloadPackage(name, version) {
  const packageName = `${name}@${version}`;
  console.log(`Downloading ${packageName}`);
  execSync(`npm pack ${packageName}`, { stdio: 'inherit' });
}

function processDep(deps) {
  console.log("[DEBUG] deps", deps);
  for (const key in deps) {
    let value = deps[key];
    let version = value;
    console.log("[DEBUG] version", version);
    
    if (version.includes('^')) {
      let majorVersion ;
      if (version.includes('.')){
        majorVersion = version.slice(1, version.indexOf('.'));
      }
      else {
        majorVersion=version.slice(1);
      }
      version = getLatestVersionWithinMajor(key, majorVersion, version.slice(1));
      console.log("[DEBUG] result of get latest version", version);
    }
    console.log("[DEBUG] CUSTOM", "["+key+" "+version+"]");
    try{
    if (version.includes('>=')) {
      //const majorVersion = (version.slice(1, version.indexOf('>='))).slice;
      version = '"'+version+'"';
    }} catch(error){
      console.log("[DEBUG] ERROR", "["+key+" "+version+"]");
      console.log("[DEBUG] ERROR deps", deps);
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
      var parts = name.split('/');
      var short_name_parts = parts.slice(1);
      short_name = short_name_parts.join('/');
      if (short_name.includes('node_modules/')) {
        parts = short_name.split('node_modules/');
        short_name = parts[parts.length - 1];
        console.log('short_name = ', short_name);
      }
    }

    downloadPackage(short_name, info.version);
    if (info.dependencies) {
      console.log("[DEBUG] info dependencies", info.dependencies);
      // clean deps
      var deps = info.dependencies;
      for (const key in deps){
        let value = deps[key];
        if (value.includes("@")){
          // alors il faut clean
          parts = value.split("@");
          info.dependencies[parts[0]]=parts[1];
          delete info.dependencies[key];
        }
      } 
      processDep(info.dependencies);
    }
  }
}

console.log(packageLock);
processDependencies(packageLock.packages);
