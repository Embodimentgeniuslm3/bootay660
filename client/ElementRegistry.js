import {
  getComponentName,
  getToolbarName,
  processAssessmentType
} from 'tce-core/utils';
import cloneDeep from 'lodash/cloneDeep';
import elementList from './components/content-elements';
import find from 'lodash/find';
import pick from 'lodash/pick';
import Promise from 'bluebird';

const EXTENSIONS_LIST = 'index';

export default class ElementRegistry {
  constructor(Vue) {
    this._registry = [];
    this.Vue = Vue;
  }

  async initialize() {
    await Promise.map(elementList, location => this.load(location));
    const extensions = await this.loadExtensionList();
    await Promise.map(extensions, location => this.load(location, true));
  }

  async load(location, isExtension) {
    const { _registry, Vue } = this;
    const element = isExtension
      ? (await import(`../extensions/content-elements/${location}`)).default
      : (await import(`./components/content-elements/${location}`)).default;
    const attrs = [
      'name', 'type', 'subtype', 'version', 'schema', 'initState', 'ui'
    ];
    const isAssessment = element.type === 'ASSESSMENT';
    const type = isAssessment
      ? processAssessmentType(element.subtype)
      : element.type;
    const componentName = getComponentName(type);
    _registry.push({ ...pick(element, attrs), componentName });
    Vue.component(componentName, element.Edit);
    if (element.Toolbar) Vue.component(getToolbarName(type), element.Toolbar);
  }

  all() {
    return cloneDeep(this._registry);
  }

  get(type) {
    if (!type) return this.all();
    const { _registry: registry } = this;
    const res = find(registry, { subtype: type }) || find(registry, { type });
    return res && cloneDeep(res);
  }

  loadExtensionList() {
    return import(`../extensions/content-elements/${EXTENSIONS_LIST}`)
      .then(module => module.default)
      .catch(() => console.log('No extensions loaded!') || []);
  }
}
