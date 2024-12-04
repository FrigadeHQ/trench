import { trench } from '../src';
import fetch from 'node-fetch';

jest.mock('node-fetch');

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('analytics-plugin-trench', () => {
  const config = {
    publicApiKey: 'test-key',
    serverUrl: 'https://api.test.com',
    enabled: true,
  };

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({} as any);
  });

  it('should initialize correctly', () => {
    const plugin = trench(config);
    plugin.initialize();
    expect(plugin.loaded()).toBe(true);
  });

  it('should not initialize when disabled', () => {
    const plugin = trench({ ...config, enabled: false });
    plugin.initialize();
    expect(plugin.loaded()).toBe(false);
  });

  it('should track events', async () => {
    const plugin = trench(config);
    const payload = {
      event: 'test_event',
      properties: { foo: 'bar' },
      type: 'track' as const,
    };

    await plugin.track({ payload });

    expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: expect.stringContaining('test_event'),
    });
  });

  it('should track page views', async () => {
    const plugin = trench(config);
    const payload = {
      properties: { path: '/test' },
      type: 'page' as const,
    };

    await plugin.page({ payload });

    expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: expect.stringContaining('$pageview'),
    });
  });

  it('should identify users', async () => {
    const plugin = trench(config);
    const payload = {
      userId: 'test-user',
      traits: { name: 'Test User' },
    };

    await plugin.identify({ payload });

    expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: expect.stringContaining('identify'),
    });

    expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: expect.stringContaining('"traits":{"name":"Test User"}'),
    });
  });

  it('should handle group assignments', async () => {
    const plugin = trench(config);
    const groupId = 'test-group';
    const traits = { name: 'Test Group' };

    await plugin.methods.group(groupId, traits);

    expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: expect.stringContaining('group'),
    });

    expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      },
      body: expect.stringContaining('"traits":{"name":"Test Group"}'),
    });
  });

  it('should not make requests when disabled', async () => {
    const plugin = trench({ ...config, enabled: false });
    const payload = {
      event: 'test_event',
      properties: { foo: 'bar' },
      type: 'track' as const,
    };

    await plugin.track({ payload });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle trailing slashes in serverUrl', async () => {
    const plugin = trench({
      ...config,
      serverUrl: 'https://api.test.com/',
    });
    const payload = {
      event: 'test_event',
      type: 'track' as const,
    };

    await plugin.track({ payload });

    expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', expect.any(Object));
  });

  it('should not send duplicate events when batching is disabled', async () => {
    const plugin = trench({
      ...config,
      batchingEnabled: false,
    });

    const payload = {
      event: 'test_event',
      type: 'track' as const,
    };

    await plugin.track({ payload });
    await plugin.track({ payload }); // Send same event again

    expect(mockFetch).toHaveBeenCalledTimes(2); // Should only be called once
  });

  describe('event batching', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should batch events when batching is enabled', async () => {
      const plugin = trench({
        ...config,
        batchingEnabled: true,
        batchSize: 2,
      });

      const payload1 = {
        event: 'test_event_1',
        type: 'track' as const,
      };

      const payload2 = {
        event: 'test_event_2',
        type: 'track' as const,
      };

      await plugin.track({ payload: payload1 });
      expect(mockFetch).not.toHaveBeenCalled();

      await plugin.track({ payload: payload2 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
        body: expect.stringContaining('"event":"test_event_1"'),
      });
      // @ts-ignore
      expect(mockFetch.mock.calls[0][1].body).toContain('"event":"test_event_2"');
    });
    it('should handle duplicate events in batches when interspersed with other events', async () => {
      const plugin = trench({
        ...config,
        batchingEnabled: true,
        batchSize: 3,
      });

      const duplicatePayload = {
        event: 'duplicate_event',
        type: 'track' as const,
      };

      const uniquePayload = {
        event: 'unique_event',
        type: 'track' as const,
      };

      await plugin.track({ payload: duplicatePayload });
      await plugin.track({ payload: uniquePayload });
      await plugin.track({ payload: duplicatePayload });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // @ts-ignore
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.events).toHaveLength(3);
      expect(requestBody.events[0].event).toBe('duplicate_event');
      expect(requestBody.events[1].event).toBe('unique_event');
      expect(requestBody.events[2].event).toBe('duplicate_event');
    });

    it('shoul not dedupe consecutive duplicate events in batch', async () => {
      const plugin = trench({
        ...config,
        batchingEnabled: true,
        batchSize: 2,
      });

      const duplicatePayload = {
        event: 'duplicate_event',
        type: 'track' as const,
      };

      // Send same event twice in a row
      await plugin.track({ payload: duplicatePayload });
      await plugin.track({ payload: duplicatePayload });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // @ts-ignore
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.events).toHaveLength(2); // Should dedupe to just 2 events
      expect(requestBody.events[0].event).toBe('duplicate_event'); // First duplicate
      expect(requestBody.events[1].event).toBe('duplicate_event'); // First duplicate
    });

    it('should flush batch after timeout', async () => {
      const plugin = trench({
        ...config,
        batchingEnabled: true,
        batchTimeout: 1000,
      });

      const payload = {
        event: 'test_event',
        type: 'track' as const,
      };

      await plugin.track({ payload });
      expect(mockFetch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1001);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
        },
        body: expect.stringContaining('"event":"test_event"'),
      });
    });

    it('should not batch events when batching is disabled', async () => {
      const plugin = trench({
        ...config,
        batchingEnabled: false,
      });

      const payload = {
        event: 'test_event',
        type: 'track' as const,
      };

      await plugin.track({ payload });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
