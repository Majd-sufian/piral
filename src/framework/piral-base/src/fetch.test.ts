import { fetchDependency } from './fetch';

const mockResponse = 'This is an example response';

describe('fetch Helper Module', () => {
  beforeEach(() => {
    window.fetch = jest.fn((_, options) =>
      Promise.resolve({
        text() {
          return Promise.resolve(mockResponse);
        },
        json() {
          return Promise.resolve(options);
        },
      }),
    ) as any;
  });

  afterEach(() => {
    delete window.fetch;
  });

  it('fetches the given URL correctly', async () => {
    const response = await fetchDependency('http://example.com/foo');
    expect(response).toBe(mockResponse);
  });
});
