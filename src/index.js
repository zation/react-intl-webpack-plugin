import { join } from 'path';
import { writeFileSync, readFileSync } from 'fs';
import mapKeys from 'lodash/fp/mapKeys';
import mapValues from 'lodash/fp/mapValues';
import find from 'lodash/fp/find';
import prop from 'lodash/fp/prop';
import flow from 'lodash/fp/flow';
import isEqual from 'lodash/fp/isEqual';
import stringify from 'json-stable-stringify';

const stringifyOptions = {
  space: 2,
  cmp: (a, b) => a.key > b.key,
};

class SimpleReactIntlWebpackPlugin {
  constructor({
    sourcePath,
    translationsPath,
    outputPath,
    methodName,
    languages,
    defaultLanguage,
  }) {
    this.sourcePath = sourcePath;
    this.translationsPath = translationsPath;
    this.outputPath = outputPath;
    this.regExp = new RegExp(`${methodName || 'defineMessages'}\\(((.|\\n)*?)\\)`);
    this.languages = languages;
    this.defaultLanguage = defaultLanguage;
    this.cachedDefaultMessages = null;
  }

  apply(compiler) {
    compiler.plugin('compilation', compilation => {
      const translations = JSON.parse(readFileSync(this.translationsPath, 'utf8'));

      compilation.plugin('record-modules', modules => {
        const defaultMessages = modules.filter(({ resource }) =>
          resource
          && resource.includes(this.sourcePath)
          && !resource.includes('/node_modules/')
          && resource.endsWith('.js')
        ).reduce((result, { resource, id }) => {
          const source = readFileSync(resource, 'utf8');
          const messagesMatches = this.regExp.exec(source);
          if (messagesMatches && messagesMatches.length > 1) {
            const messagesObject = eval(`(${messagesMatches[1].replace(/\n/g, '')})`);
            result = {
              ...result,
              ...mapKeys(key => `${id}-${key}`, messagesObject),
            };
          }
          return result;
        }, {});

        if (!isEqual(defaultMessages, this.cachedDefaultMessages)) {
          this.languages.forEach(language => {
            const messages = mapValues(value => flow(
              find(translation => translation[this.defaultLanguage] === value),
              prop(language)
            )(translations), defaultMessages);
            writeFileSync(
              join(this.outputPath, `${language}-messages.js`),
              `export default ${stringify(messages, { space: 2 })}`
            );
          });
          this.cachedDefaultMessages = defaultMessages;
        }
      });
    });
  }
}

export default SimpleReactIntlWebpackPlugin;
