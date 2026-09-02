import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { SUPPORTED } from './constants.js'
import { loadYaml } from './yaml.js'

export class SchemaValidator {
  constructor(root, bag) {
    this.root = root
    this.bag = bag
    this.schema = loadYaml(root, 'config/schema.yaml', bag, { metadata: false })
    if (!this.schema) return
    if (this.schema.$id !== SUPPORTED.schemaId) {
      bag.error('SCHEMA_VERSION', `Unsupported schema document ID ${this.schema.$id ?? '<missing>'}.`, 'config/schema.yaml')
      return
    }
    try {
      this.ajv = new Ajv2020({ allErrors: true, strict: true, strictTypes: false, strictRequired: false, validateFormats: true })
      addFormats(this.ajv, { mode: 'full' })
      this.ajv.addSchema(this.schema)
    } catch (error) {
      bag.error('SCHEMA_COMPILE', error.message, 'config/schema.yaml')
    }
  }

  validate(definition, value, path) {
    if (!this.ajv) return false
    const supportedVersion = SUPPORTED.records[definition]
    if (supportedVersion === undefined) throw new Error(`Unknown schema definition ${definition}`)
    if (value?.schema_version !== supportedVersion) {
      this.bag.error('RECORD_VERSION', `Unsupported ${definition} schema_version ${String(value?.schema_version)}; expected ${supportedVersion}.`, path)
    }
    let validate
    try {
      validate = this.ajv.getSchema(`${SUPPORTED.schemaId}#/$defs/${definition}`)
    } catch (error) {
      this.bag.error('SCHEMA_COMPILE', error.message, 'config/schema.yaml')
      return false
    }
    if (!validate) {
      this.bag.error('SCHEMA_DEFINITION', `Schema definition ${definition} is unavailable.`, 'config/schema.yaml')
      return false
    }
    const valid = validate(value)
    for (const error of validate.errors ?? []) {
      const at = error.instancePath || '/'
      this.bag.error('SCHEMA_INVALID', `${at} ${error.message}.`, path, { details: { keyword: error.keyword, params: error.params } })
    }
    return valid
  }
}
