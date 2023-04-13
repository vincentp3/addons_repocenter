const fs = require('fs');
const { execSync } = require('child_process');

const packageLock = JSON.parse(fs.readFileSync('npm-shrinkwrap.json', 'utf8'));

function downloadPackage(name, version) {
  const packageName = `${name}@${version}`;
  console.log(`Downloading ${packageName}`);
  execSync(`npm pack ${packageName}`, { stdio: 'inherit' });
}
function processDep(deps){
  for (const key in deps){
    let value = deps[key];
    var version = value;
    if (version.includes("^")){
      version = "latest";
    }
    downloadPackage(key, version);
  }
}
function processDependencies(deps) {
  for (const [name, info] of Object.entries(deps)) {
    console.log("Traitement de ", name, info);
    if (name === '') {
      continue; // Ignore root project
    }
    var short_name = name;
    if (name.includes("/")){
    var parts = name.split("/");
    var short_name_parts = parts.slice(1);
    short_name = short_name_parts.join("/");
    if (short_name.includes("node_modules/")){
      parts = short_name.split("node_modules/");
      short_name = parts[parts.length - 1];
      console.log("short_name = ", short_name);
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
