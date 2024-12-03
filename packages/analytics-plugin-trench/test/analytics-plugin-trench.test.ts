import { trench } from '../src';
import fetch from 'node-fetch';

jest.mock('node-fetch');

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('trench', () => {
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
});
