import http from "k6/http";
import { check, sleep } from "k6";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.1.0/index.js";

export let options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp-up to 10 users over 30 seconds
    { duration: "1m", target: 10 }, // Stay at 10 users for 1 minute
    { duration: "30s", target: 0 }, // Ramp-down to 0 users over 30 seconds
  ],
};

export default function () {
  // Generate unique user data
  const uniqueID = uuidv4();
  const uniqueEmail = `testuser+${uniqueID}@example.com`;
  const uniqueUsername = `testuser_${uniqueID}`;

  // Load test for user-service
  let userRes = http.post(
    "http://127.0.0.1:63192/api/users/register",
    JSON.stringify({
      name: uniqueUsername,
      email: uniqueEmail,
      password: "password123",
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(userRes, { "status was 201": (r) => r.status === 201 });

  sleep(1);
}
