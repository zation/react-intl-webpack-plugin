import path from 'path';
import { writeFileSync } from 'fs';

class SimpleReactIntlWebpackPlugin {
  constructor({ sourcePath, outputFile }) {
    this.sourcePath = sourcePath;
    this.outputFile = outputFile;
  }

  apply(compiler) {
    compiler.plugin('emit', (compilation, callback) => {
      const moduleMap = compilation.chunks[0].modules.filter(
        ({ resource }) =>
        resource
        && resource.includes(this.sourcePath)
        && !resource.includes('/node_modules/')
        && resource.endsWith('.js')
      ).map(module => ({
        id: module.id,
        file: path.relative(process.cwd(), module.resource),
      }));

      writeFileSync(this.outputFile, JSON.stringify(moduleMap, null, 2));

      callback();
    });
  }
}

export default SimpleReactIntlWebpackPlugin;
