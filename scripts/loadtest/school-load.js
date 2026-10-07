// k6 load test for one tenant school. Run against STAGING only, never production.
//
//   k6 run -e BASE_URL=https://demo.staging.example.com -e USERNAME=admin@demo -e PASSWORD=... \
//     scripts/loadtest/school-load.js
//
// Seed staging with a realistic school first (~2,000 students, 3 terms of scores and payments).
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL;
const API = `${BASE_URL}/api/proxy`;

export const options = {
  scenarios: {
    school_day: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    'http_req_duration{name:analytics}': ['p(95)<1500'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: __ENV.USERNAME, password: __ENV.PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, { 'logged in': (r) => r.status === 200 });
  return { cookies: http.cookieJar().cookiesForURL(BASE_URL) };
}

export default function (data) {
  const jar = http.cookieJar();
  for (const [name, values] of Object.entries(data.cookies)) jar.set(BASE_URL, name, values[0]);

  group('dashboard', () => {
    check(
      http.get(`${API}/academic/students/?page=1&page_size=50`, { tags: { name: 'students' } }),
      {
        'students 200': (r) => r.status === 200,
      }
    );
    check(
      http.get(`${API}/bursary/payments/?page=1&page_size=50`, { tags: { name: 'payments' } }),
      {
        'payments 200': (r) => r.status === 200,
      }
    );
    check(http.get(`${API}/academic/analytics/`, { tags: { name: 'analytics' } }), {
      'analytics 200': (r) => r.status === 200,
    });
  });
  sleep(1 + Math.random() * 2);
}
