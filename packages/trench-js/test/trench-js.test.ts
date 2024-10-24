import Trench from '../src';

describe('Trench Analytics', () => {
  function getConfig() {
    return {
      publicApiKey: 'public-d613ee4e-d803-4b02-9058-70aa4a04ff28',
      enabled: true,
      serverUrl: 'https://sandbox.trench.dev',
    };
  }

  test('should initialize analytics', () => {
    const trench = new Trench(getConfig());
    expect(trench.loaded()).toBe(true);
  });

  test('should track an event', async () => {
    const trench = new Trench(getConfig());
    await trench.track('test_event', { key: 'value' });
    // Assuming there's a way to verify the event was tracked
  });

  test('should track a page view', async () => {
    const trench = new Trench(getConfig());
    await trench.page({ title: 'Test Page' });
    // Assuming there's a way to verify the page view was tracked
  });

  test('should identify a user', async () => {
    const trench = new Trench(getConfig());
    await trench.identify('user123', { email: 'user@example.com' });
    // Assuming there's a way to verify the user was identified
  });

  test('should group a user', async () => {
    const trench = new Trench(getConfig());
    await trench.group('group123', { groupName: 'Test Group' });
    // Assuming there's a way to verify the group was tracked
  });
});
