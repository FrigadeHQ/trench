import Analytics from 'analytics';
import { trench, TrenchConfig } from 'analytics-plugin-trench';

class Trench {
  private analytics: ReturnType<typeof Analytics>;

  constructor(config: TrenchConfig) {
    this.analytics = Analytics({
      app: 'trench-app',
      plugins: [trench(config)],
    });
  }

  track(event: string, properties: Record<string, unknown>) {
    this.analytics.track(event, properties);
  }

  page(properties: Record<string, unknown>) {
    this.analytics.page(properties);
  }

  identify(userId: string, traits: Record<string, unknown>) {
    this.analytics.identify(userId, traits);
  }

  group(groupId: string, traits: Record<string, unknown>) {
    // @ts-ignore
    this.analytics.plugins.trench.group(groupId, traits);
  }

  loaded() {
    return true;
  }
}

export default Trench;
