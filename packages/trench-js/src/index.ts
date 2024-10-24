import Analytics from 'analytics';
import { trench, TrenchConfig } from 'analytics-plugin-trench';

class Trench {
  private analytics: any;

  constructor(config: TrenchConfig) {
    this.analytics = Analytics({
      app: 'trench-app',
      plugins: [trench(config)],
    });
  }

  initialize() {
    this.analytics.initialize();
  }

  track(event: string, properties: object) {
    this.analytics.track(event, properties);
  }

  page(properties: object) {
    this.analytics.page(properties);
  }

  identify(userId: string, traits: object) {
    this.analytics.identify(userId, traits);
  }

  group(groupId: string, traits: object) {
    this.analytics.group(groupId, traits);
  }

  loaded() {
    return this.analytics.loaded();
  }
}

export default Trench;
