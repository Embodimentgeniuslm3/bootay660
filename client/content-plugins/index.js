import ContainerRegistry from './ContainerRegistry';
import ElementRegistry from './ElementRegistry';
import MetaRegistry from './MetaRegistry';

export default class ContentRepository {
  constructor(Vue) {
    this.containerRegistry = new ContainerRegistry(Vue);
    this.elementRegistry = new ElementRegistry(Vue);
    this.metaRegistry = new MetaRegistry(Vue);
  }

  initialize() {
    return Promise.all([
      this.containerRegistry.initialize(),
      this.elementRegistry.initialize(),
      this.metaRegistry.initialize()
    ]);
  }
}
